import numpy as np
from typing import Dict


def transform_features(raw: Dict[str, object]) -> np.ndarray:
    """Minimal feature transformation:
    - Accepts a dict of numeric-like values
    - Returns a 1D numpy array in deterministic order
    """
    if not raw:
        return np.array([0.0])

    values = []
    for k in sorted(raw.keys()):
        v = raw[k]
        try:
            values.append(float(v))
        except Exception:
            values.append(0.0)
    return np.array(values, dtype=float)
