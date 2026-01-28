import numpy as np
from scipy.stats import norm
from typing import List, Optional


class Markov():
    def __init__(self, T: np.ndarray, i: int, n: int, seed: Optional[int] = None) -> None:
        if not np.all(np.sum(T, axis=2)):
            raise ValueError(f"The rows of transition matrix 'T' should be equal to 1")
        if not np.all(T[:, 0, 0]):
            raise IndexError(f"Absorbing states should precede transient states")

        self.P = T
        self.i = i
        self.n = n
        self.n_samples, self.n_states, _ = T.shape
        self.i_absorbing = np.diag(T[0]) == 1
        self.rng = np.random.default_rng(seed=seed)

    @property
    def r(self) -> int:
        """
        Number of transient states
        """
        return sum(~self.i_absorbing)

    @property
    def s(self) -> int:
        """
        Number of absorbing states
        """
        return sum(self.i_absorbing)

    @property
    def mu(self) -> np.ndarray:
        """
        Initial distribution
        """
        mu = np.zeros((self.n_samples, self.n_states))
        mu[:, self.i] = 1

        return mu

    @property
    def Q(self) -> np.ndarray:
        """
        Probabilities of moving between transient states
        """
        return self.P[:, ~self.i_absorbing, :][:, :, ~self.i_absorbing]

    @property
    def R(self) -> np.ndarray:
        """
        Probabilities of moving from transient states to absorbing state(s)
        """
        return self.P[:, ~self.i_absorbing, :][:, :, self.i_absorbing]

    @property
    def I(self) -> np.ndarray:
        """
        Identity matrix
        """
        return np.eye(self.r)

    @property
    def N(self) -> np.ndarray:
        """
        Number of visits to transient states over n = 0, 1, ..., steps
        """
        Qn_plus_1 = np.linalg.matrix_power(self.Q, self.n + 1)
        A = self.I - Qn_plus_1
        B = self.I - self.Q

        return np.linalg.solve(B, A)

    @property
    def Sigma(self) -> np.ndarray:
        """
        Covariance matrix of the number of visits to transient states over n steps
        """
        p_visit = np.zeros((self.n_samples, self.r, self.n + 1))
        p_diag = np.zeros((self.n_samples, self.r, self.n + 1))

        Qn = np.zeros_like(self.Q) + np.eye(self.r)

        for n in range(self.n + 1):
            p_visit[:, :, n] = Qn[:, self.i, :]
            p_diag[:, :, n] = np.diagonal(Qn, axis1=1, axis2=2)

            Qn = np.einsum('ijl, ilk -> ijk', Qn, self.Q)

        mu = np.sum(p_visit, axis=2)
        p_diag_cumsum = np.cumsum(p_diag[:, :, ::-1], axis=2)[:, :, ::-1]

        S = 2.0 * np.einsum('ijl, ikl -> ijk', p_visit[:, :, :-1], p_diag_cumsum[:, :, 1:])
        S[:, np.arange(self.r), np.arange(self.r)] += mu
        S -= np.einsum('ij, ik -> ijk', mu, mu)

        return S

    @property
    def corr(self):
        """
        Correlation matrix between possible states and actions
        """
        sigma_sym = 0.5 * (self.Sigma * np.transpose(self.Sigma, axes=(0, 2, 1)))  # enforce symmetry
        std = np.sqrt(np.diagonal(sigma_sym, axis1=1, axis2=2))
        inv_std = 1.0 / std

        corr = inv_std[:, :, None] * sigma_sym * inv_std[:, None, :]
        corr[:, np.arange(self.r), np.arange(self.r)] = 1.0

        return corr

    def p_Nj_gt_Nk(self, j: int | List[int], k: int | List[int]) -> np.ndarray:
        """
        Probability that the number of visits to transient state(s) j is greater than the number of visits to transient state(s) k
        """
        mu_j = np.sum(self.N[:, self.i, j], axis=1)
        mu_k = np.sum(self.N[:, self.i, k], axis=1)

        var_j = np.sum(self.Sigma[:, j][:, :, j], axis=(1, 2))
        var_k = np.sum(self.Sigma[:, k][:, :, k], axis=(1, 2))
        cov_jk = np.sum(self.Sigma[:, j][:, :, k], axis=(1, 2))

        z = (mu_j - mu_k) / (var_j + var_k - 2 * cov_jk)

        return norm.cdf(z)

    @property
    def tau(self) -> np.ndarray:
        """
        Expected number of steps before absorption
        """
        ones = np.ones(self.N.shape[-1])

        return self.N @ ones

    @property
    def tau2(self) -> np.ndarray:
        """
        Variance of the number of steps before absorption
        """
        tau_squared = self.tau ** 2

        return (2 * self.N - self.I) @ self.tau - tau_squared



    def f(self, j: int | List[int]) -> np.ndarray:
        """
        Probabilities of return times (1, 2, ..., n) of transient state(s) j
        """
        j = np.atleast_1d(j)
        n_j = len(j)

        diags = np.zeros((self.n_samples, n_j, self.n))
        Pn = np.zeros_like(self.P) + np.eye(self.n_states)

        for n in range(1, self.n + 1):
            Pn = np.matmul(Pn, self.P)
            diags[:, :, n - 1] = Pn[:, j, j]

        f = np.zeros((self.n_samples, n_j, self.n))
        f[:, :, 0] = diags[:, :, 0]

        for n in range(2, self.n + 1):
            f_prev = f[:, :, :n - 1]
            diags_prev = diags[:, :, 1: n][:, :, ::-1]
            conv = np.sum(f_prev * diags_prev, axis=2)
            f[:, :, n - 1] = np.maximum(diags[:, :, n - 1] - conv, 0.0)  # enforce non-negativity

        return f

    def p_no_return(self, f: np.ndarray) -> np.ndarray:
        """
        Probabilities of no return within the remaining time n - t - 1 after first hitting it at time t
        """
        n = f.shape[2]
        mask = np.triu(np.ones((n, n)), k=1)
        mask = mask[:, ::-1]  # flip so t=0 aligns with sum over s=1 to n-1
        f_tail = np.einsum('...s, ts -> ...t', f, mask)  # apply mask via einsum

        return 1.0 - f_tail

    def p_N(self, j: int | List[int], x: int) -> np.ndarray:
        """
        Probability of visiting transient state(s) j exactly x times
        """
        j = np.atleast_1d(j)
        n_j = len(j)

        # TODO: deal with mismatch of indexing in f and h
        f = self.f(j=[14, 12, 13, 11])
        h = self.h(j=[18, 16, 17, 15])

        p = np.zeros((self.n_samples, n_j, x + 1))

        # no visits
        p[:, :, 0] = 1 - np.sum(h, axis=2)

        # visit once and no return
        no_return = self.p_no_return(f=f)
        p[:, :, 1] = np.sum(h * no_return, axis=2)

        # visit more than once
        conv = h.copy()

        for k in range(2, x + 1):
            conv_k = np.zeros_like(conv)

            for n in range(1, self.n):
                conv_k[:, :, n:] += np.einsum('ijs, ij -> ijs', conv[:, :, :-n], f[:, :, n - 1])

            conv = conv_k
            p[:, :, k] = np.sum(conv * no_return, axis=2)

        return p

    def p_X_tau_minus_1(self, j: int | List[int], k: int) -> np.ndarray:
        """
        Probabilities of being in transient state(s) j at step tau - 1 where tau is the time of absorption
        """
        j = np.atleast_1d(j)

        mask = np.ones(self.n_states, dtype=bool)
        mask[k] = False

        # remove transitions from and to absorbing state k
        Q = self.P[:, mask][:, :, mask]
        mu = self.mu[:, mask]

        y = np.nonzero(mask)[0].searchsorted(j)
        t = Q.shape[1]

        Q_powers = np.zeros((self.n_samples, self.n, t, t))
        Q_powers[:, 0] = np.eye(t)[None, :, :]

        for n in range(1, self.n):
            Q_powers[:, n] = Q_powers[:, n - 1] @ Q

        Q_y = np.take(Q_powers, y, axis=-1)
        p_Xt_equals_j = np.einsum("st, sntj -> sjn", mu, Q_y)
        p_jk = self.P[:, j, k]
        p = p_Xt_equals_j * p_jk[:, :, None]

        return np.sum(p, axis=2)

    def p_N_gt_0(self, j: int | List[int], k: int) -> np.ndarray:
        """
        Probabilities of visiting transient state(s) j at least once before visiting state(s) k after n steps
        TODO: if j consists of multiple states
        """
        j = np.atleast_1d(j)
        k = np.atleast_1d(k)

        h_j = self.h(j=j)
        h_k = self.h(j=k)

        H_k = np.cumsum(h_k, axis=2)
        survival_k = 1 - np.sum(H_k, axis=1)

        p = np.sum(h_j * survival_k[:, None, :], axis=(1, 2))

        return p

    @property
    def p_s(self) -> np.ndarray:
        """
        Probabilities of absorption
        """
        return self.N @ self.R

    def simulate(self, x: int) -> np.ndarray:
        """
        Simulate x paths based on probabilities of transition matrix
        """
        chains = np.zeros((self.n_samples, x, self.n), dtype=int)

        mu = np.concatenate([
            np.zeros((self.n_samples, self.s)), self.mu
        ], axis=1)
        mu = np.repeat(mu[:, None, :], x, axis=1)

        # Gumbel-max trick
        log_mu = np.where(mu > 0, np.log(mu), -np.inf)
        U = np.random.rand(self.n_samples, x, self.n_states)
        G = -np.log(-np.log(U))
        X = np.argmax(log_mu + G, axis=2)

        chains[:, :, 0] = X

        for n in range(1, self.n):
            p = self.P[np.arange(self.n_samples)[:, None], X]
            log_p = np.where(p > 0, np.log(p), -np.inf)
            U = np.random.rand(self.n_samples, x, self.n_states)
            G = -np.log(-np.log(U))
            Xn = np.argmax(log_p + G, axis=2)

            X = Xn
            chains[:, :, n] = Xn

        return chains