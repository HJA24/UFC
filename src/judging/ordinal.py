import numpy as np
import scipy.special as ss


def pmf(eta: np.ndarray, c: np.ndarray) -> np.array:
    """
    Example
    -------
    >>> p = np.array([0.1, 0.3, 0.2, 0.35, 0.05])
    >>> cum_p = np.cumsum(p)
    >>> cum_logits = ss.logit(cum_p[:-1])
    >>> eta = np.zeros((1, 1))
    >>> p_K = pmf(eta=eta, c=cum_logits[None,:] )
    >>> print(p_K)
    [[0.1  0.3  0.2  0.35 0.05]]
    """
    if eta.shape[0] != c.shape[0]:
        raise ValueError(
            "shape of 'eta' and 'c' should be the same"
    )

    K = c.shape[-1]
    k = np.arange(1, K)

    p = np.zeros((eta.shape[0], K + 1))
    p[:, 0] = 1 - ss.expit(eta - c[:, 0])
    p[:,-1] = ss.expit(eta - c[:, -1])
    p[:, k] = ss.expit(eta[:, np.newaxis] - c[:, k - 1]) - ss.expit(eta[:, np.newaxis] - c[:, k])

    return p