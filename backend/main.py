from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pathlib import Path
import uuid
import shutil

from ai.inference.pipeline import run_job_local
from ai.utils.paths import OUTPUTS_DIR

app = FastAPI(title="Medical 3D File Processor API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("local_uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/jobs/local-demo")
def local_demo():
    """
    No upload needed. Generates a synthetic NIfTI and runs segmentation demo.
    """
    job_id = str(uuid.uuid4())
    stats = run_job_local(job_id=job_id, input_path=None)
    return stats

@app.post("/jobs/local-upload-and-run")
async def local_upload_and_run(file: UploadFile = File(...)):
    """
    Upload a .nii/.nii.gz, run CPU demo segmentation, return stats + preview paths.
    """
    name = (file.filename or "").lower()
    if not (name.endswith(".nii") or name.endswith(".nii.gz")):
        raise HTTPException(status_code=400, detail="Only .nii or .nii.gz supported")

    job_id = str(uuid.uuid4())
    in_path = UPLOAD_DIR / f"{job_id}_{file.filename}"
    with in_path.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        stats = run_job_local(job_id=job_id, input_path=in_path)
        return stats
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/jobs/{job_id}/download/seg")
def download_seg(job_id: str):
    seg_path = OUTPUTS_DIR / job_id / "seg.nii.gz"
    if not seg_path.exists():
        raise HTTPException(status_code=404, detail="seg not found")
    return FileResponse(str(seg_path), filename="seg.nii.gz")

@app.get("/jobs/{job_id}/preview/{name}")
def get_preview(job_id: str, name: str):
    """
    name examples: axial.png, axial_overlay.png, coronal.png, ...
    """
    p = OUTPUTS_DIR / job_id / "preview" / name
    if not p.exists():
        raise HTTPException(status_code=404, detail="preview not found")
    return FileResponse(str(p), filename=name)