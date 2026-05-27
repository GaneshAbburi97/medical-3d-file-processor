from pathlib import Path
import nibabel as nib
import numpy as np

def load_nifti(path: Path):
    img = nib.load(str(path))
    data = img.get_fdata(dtype=np.float32)
    return img, data

def save_nifti(affine, array: np.ndarray, out_path: Path):
    out = nib.Nifti1Image(array.astype(np.float32), affine=affine)
    nib.save(out, str(out_path))