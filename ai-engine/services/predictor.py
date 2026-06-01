import numpy as np
from typing import Tuple, Any


def predict(features: Any) -> Tuple[float, float]:
    """Stub predictor: returns a simple normalized score and fixed confidence.
    Accepts a numpy array or sequence of numeric values.
    """
    try:
        arr = np.array(features, dtype=float)
        if arr.size == 0:
            score = 0.0
        else:
            # simple heuristic: scale mean to [0,1]
            mean = float(np.nanmean(arr))
            score = 1.0 / (1.0 + np.exp(-mean)) if not np.isnan(mean) else 0.0
            # normalize to 0..1 (sigmoid already in 0..1)
            score = float(np.clip(score, 0.0, 1.0))
    except Exception:
        score = 0.0

    confidence = 0.9
    return score, confidence
