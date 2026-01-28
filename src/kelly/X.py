import numpy as np
from gurobipy import Model, GRB
from scripts.database.database import get_operations
from typing import List


def X(market_ids: List[int]) -> np.ndarray:
    solutions = []
    n_markets = len(market_ids)

    I = np.array([
        [0, 1, 0, 0, 0],
        [1, 0, 1, 1, 0],
        [0, 1, 0, 1, 1],
        [0, 1, 1, 0, 0],
        [0, 0, 1, 0, 0]
    ])

    N = np.array([
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
    ])

    T = np.array([

    ])

    m = Model()
    markets = m.addMVar((n_markets, 1), vtype=GRB.BINARY)

    # XOR
    for i, j in zip(*np.nonzero(I)):
        m.addConstr(markets[i] + markets[j] == 1)

    # NAND
    for i, j in zip(*np.nonzero(N)):
        m.addConstr(markets[i] + markets[j] <= 1)

    # SO
    for i, j in zip(*np.nonzero(T)):
        m.addConstr(markets[i] <= markets[j])

    m.setObjective(0, GRB.MAXIMIZE)  # necessary?
    m.Params.PoolSearchMode = 2
    m.optimize()

    for s in range(m.SolCount):
        m.setParam(GRB.Param.SolutionNumber, s)
        solutions.append(markets.Xn.flatten())

    return np.array(solutions).astype(int)