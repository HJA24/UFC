import numpy as np
import gurobipy as grb
from typing import Any


def R(odds: np.ndarray, m: int):
    """ matrix of possible returns """
    X = np.eye(2)

    return X * odds - 1


def pdf(p: np.ndarray, X: np.ndarray) -> np.array:
    """ calculate the joint probability for the given outcome and corresponding probabilities """
    return np.prod(p ** X, axis=1)


def bigMs(pi: np.ndarray, rs: np.ndarray) -> np.ndarray:
    """ create vector of upper bounds for bankroll """
    n_outcomes, n_samples = pi.shape

    return np.array(
        [
            np.sum(
                [pi[o,s] * np.log(1 + np.abs(rs[o]).sum()) for o in range(n_outcomes)]
            )
            for s in range(n_samples)
        ]
    )


def create_model(env: grb.Env, **kwargs: Any) -> grb.Model:
    mip_focus = kwargs.get('mip_focus', 3)
    func_pieces = kwargs.get('func_pieces', -1)
    func_piece_error = kwargs.get('func_piece_error', 0.001)

    m = grb.Model(env=env)

    m.setParam('MIPFocus', mip_focus)
    m.setParam('FuncPieces', func_pieces)
    m.setParam('FuncPieceError', func_piece_error)
    m.setParam('TimeLimit', 2 * 60)

    return m


def create_env() -> grb.Env:
    env = grb.Env(empty=True)
    env.setParam('LogToConsole', 0)
    env.setParam('OutputFlag', 1)
    env.start()

    return env


def kelly(epi: np.ndarray, pi: np.ndarray, rs: np.ndarray, cc: bool, dc: bool, **kwargs: Any) -> np.ndarray:
    """
    epi: (expected) probability
    rs: returns
    cc: chance constraint
    """
    lay = kwargs.get('lay', False)
    alpha = kwargs.get('alpha', 0.5)
    gamma = kwargs.get('gamma', 5)

    with create_env() as env:
        with create_model(env=env, **kwargs) as model:

            n_samples, n_outcomes = epi.shape

            if cc:
                _, n_samples = pi.shape
                ## pi = np.hstack((pi, 1 - pi)).reshape(n_outcomes, n_samples).T
                Ms = bigMs(pi=pi, rs=rs)
            else:
                Ms = bigMs(pi=epi, rs=rs)

            n_matches = int(np.log2(n_outcomes))

            f = model.addVars(2 * n_matches, lb=0.0, vtype=grb.GRB.CONTINUOUS, name='f')
            b = model.addVars(n_samples, vtype=grb.GRB.BINARY, name='b')
            y = model.addVars(n_outcomes, lb=-1E6, vtype=grb.GRB.CONTINUOUS, name='y')
            w = model.addVars(n_outcomes, lb=0.0, vtype=grb.GRB.CONTINUOUS)

            if lay:
                u = model.addVar(lb=0.0, ub=1.0, vtype=grb.GRB.CONTINUOUS)

            # objective max sum(pi_s * log( 1 + dot(r_s, f)) for all s))
            model.setObjective(
                grb.quicksum(epi[0,o] * y[o] for o in range(n_outcomes)),
                sense=grb.GRB.MAXIMIZE,
            )

            # constraints
            for s, r in enumerate(rs):
                # w[s] == 1 + dot(r_s, f) for all s
                model.addConstr(w[s] == 1 + grb.quicksum(f[i] * r[i] for i in range(2 * n_matches)), name=f'w_{s}')
                # log(w[s]) == y[s] for all s
                model.addGenConstrLog(w[s], y[s], name=f'y_{s}')

            # if B(f; X^(k)) >= 0, then b[k] == 1
            if cc:
                for s in range(n_samples):
                    model.addConstr(
                        Ms[s] * b[s] >= grb.quicksum(pi[o, s] * y[o] for o in range(n_outcomes)), name=f'M*b_{s}'
                    )

                    model.addConstr(
                        grb.quicksum(pi[o, s] * y[o] for o in range(n_outcomes)) >= -Ms[s] * (1 - b[s])
                    )

                # at least n_samples * (1 - alpha) have to fulfill the deterministic chance constraint
                model.addConstr(
                    grb.quicksum(b[s] for s in range(n_samples)) >= n_samples * (1 - alpha), name=f'CC'
                )

            if dc:
                for s in range(n_samples):
                    model.addGenConstrLog(
                        grb.quicksum(np.log(pi[s, o]) - gamma * y[o] for o in range(n_outcomes)) <= 0
                    )

            if lay:
                # ||f||_1 = sum(abs(f)) <= 1
                model.addConstr(u == grb.norm(f, 1.0))
                model.addConstr(u <= 1.0)
            else:
                model.addConstr(f.sum() <= 1)

            # solve the problem
            model.optimize()

            if model.Status != grb.GRB.OPTIMAL:
                raise ValueError('no solution(s) - model is not feasible')

            return np.array([f[i].X for i in range(2 * n_matches)])