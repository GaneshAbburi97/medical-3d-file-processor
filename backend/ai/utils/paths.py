from pathlib import Path

AI_ROOT = Path(__file__).resolve().parents[1]
DATASETS_DIR = AI_ROOT / "datasets"
DEMO_DIR = DATASETS_DIR / "demo"
OUTPUTS_DIR = AI_ROOT / "outputs"

def ensure_dirs():
    DEMO_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)