from pathlib import Path
import json
import time
import numpy as np
import cv2

from ..utils.paths import OUTPUTS_DIR, ensure_dirs
from ..utils.logging import get_logger
from ..preprocessing.io import load_nifti, save_nifti
from ..preprocessing.validation import is_nifti
from .synthetic_demo import make_synthetic_volume

log = get_logger("ai.pipeline")

def _save_json(path: Path, data: dict):
    path.write_text(json.dumps(data, indent=2))

def _to_uint8(img01: np.ndarray) -> np.ndarray:
    img = np.clip(img01 * 255.0, 0, 255).astype(np.uint8)
    return img

def _save_slice_pngs(out_dir: Path, vol01: np.ndarray, mask: np.ndarray):
    """
    Saves mid-slices (axial/coronal/sagittal) as PNG + overlay PNG.
    """
    out_dir.mkdir(parents=True, exist_ok=True)

    # shapes: (H, W, D) expected for vol01/mask in this pipeline
    H, W, D = vol01.shape
    axial_z = D // 2
    coronal_y = H // 2
    sagittal_x = W // 2

    axial = vol01[:, :, axial_z]
    coronal = vol01[coronal_y, :, :]
    sagittal = vol01[:, sagittal_x, :]

    axial_m = mask[:, :, axial_z]
    coronal_m = mask[coronal_y, :, :]
    sagittal_m = mask[:, sagittal_x, :]

    def save_pair(name, img2d, m2d):
        base = _to_uint8(img2d)
        base_bgr = cv2.cvtColor(base, cv2.COLOR_GRAY2BGR)

        # red overlay where mask==1
        overlay = base_bgr.copy()
        overlay[m2d > 0] = (0, 0, 255)  # BGR red

        blended = cv2.addWeighted(base_bgr, 0.75, overlay, 0.25, 0)

        cv2.imwrite(str(out_dir / f"{name}.png"), base_bgr)
        cv2.imwrite(str(out_dir / f"{name}_overlay.png"), blended)

    save_pair("axial", axial, axial_m)
    save_pair("coronal", coronal, coronal_m)
    save_pair("sagittal", sagittal, sagittal_m)

def run_job_local(job_id: str, input_path: Path | None):
    """
    If input_path is provided: load that NIfTI.
    If not: generate a synthetic demo volume.

    Output:
      backend/ai/outputs/<job_id>/
        input.nii.gz (if generated)
        seg.nii.gz
        stats.json
        preview/*.png
    """
    ensure_dirs()
    t0 = time.time()

    out_dir = OUTPUTS_DIR / job_id
    preview_dir = out_dir / "preview"
    out_dir.mkdir(parents=True, exist_ok=True)

    if input_path is None:
        log.info("No input provided, running synthetic demo volume")
        vol01, mask = make_synthetic_volume(shape=(128, 128, 96))
        affine = np.eye(4, dtype=np.float32)
        input_nifti = out_dir / "input_demo.nii.gz"
        save_nifti(affine, vol01, input_nifti)
    else:
        if not is_nifti(input_path):
            raise ValueError("Invalid file. Upload must be .nii or .nii.gz")
        img, data = load_nifti(input_path)
        affine = img.affine.astype(np.float32)

        # Normalize to 0..1
        data = data.astype(np.float32)
        data = data - np.min(data)
        data = data / (np.max(data) + 1e-8)

        # If 4D, take first channel/time
        if data.ndim == 4:
            data = data[..., 0]

        # Ensure (H,W,D)
        if data.ndim != 3:
            raise ValueError(f"Expected 3D NIfTI, got shape {data.shape}")

        vol01 = data
        # Lightweight “segmentation” demo: threshold + cleanup (CPU, instant)
        mask = (vol01 > 0.65).astype(np.uint8)

    # Postprocess: remove tiny noise with morphology
    kernel = np.ones((3, 3), np.uint8)
    for z in range(mask.shape[2]):
        m = mask[:, :, z]
        m = cv2.morphologyEx(m, cv2.MORPH_OPEN, kernel, iterations=1)
        m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, kernel, iterations=1)
        mask[:, :, z] = m

    seg_path = out_dir / "seg.nii.gz"
    save_nifti(affine, mask.astype(np.float32), seg_path)

    _save_slice_pngs(preview_dir, vol01, mask)

    dt = time.time() - t0
    stats = {
        "job_id": job_id,
        "runtime_seconds": round(dt, 3),
        "shape": list(vol01.shape),
        "foreground_voxels": int(mask.sum()),
        "foreground_ratio": float(mask.mean()),
        "confidence_score_demo": float(min(0.99, 0.60 + mask.mean() * 0.8)),  # demo score
        "outputs": {
            "seg_nifti": str(seg_path),
            "stats_json": str(out_dir / "stats.json"),
            "preview_dir": str(preview_dir),
        },
        "pretrained_note": "This is a CPU demo pipeline (threshold+morphology). Next phase adds MONAI pretrained bundle download.",
    }
    _save_json(out_dir / "stats.json", stats)
    return stats