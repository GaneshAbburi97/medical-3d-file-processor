from pathlib import Path

def is_nifti(path: Path) -> bool:
    name = path.name.lower()
    return path.exists() and path.is_file() and (name.endswith(".nii") or name.endswith(".nii.gz"))