import numpy as np

def make_synthetic_volume(shape=(128, 128, 96), seed=7):
    """
    Creates a medical-like 3D volume:
    - background noise
    - a bright ellipsoid "organ" region
    Returns: (volume, mask)
    """
    rng = np.random.default_rng(seed)
    vol = rng.normal(loc=0.0, scale=0.1, size=shape).astype(np.float32)

    # Create an ellipsoid in the center
    zz, yy, xx = np.meshgrid(
        np.linspace(-1, 1, shape[2]),
        np.linspace(-1, 1, shape[1]),
        np.linspace(-1, 1, shape[0]),
        indexing="ij",
    )

    # ellipsoid equation
    organ = (xx**2 / 0.35**2 + yy**2 / 0.45**2 + zz**2 / 0.50**2) < 1.0
    mask = organ.astype(np.uint8)

    # brighten the organ region
    vol = vol + mask.transpose(2, 1, 0).astype(np.float32) * 0.8

    # normalize to 0..1
    vol = vol - vol.min()
    vol = vol / (vol.max() + 1e-8)

    return vol, mask.transpose(2, 1, 0).astype(np.uint8)