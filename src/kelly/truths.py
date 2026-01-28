import itertools
from gurobipy import Model, GRB, quicksum
from scripts.database.database import get_market
from typing import Dict

truth_table = dict.fromkeys(itertools.product([1, 0], repeat=2), 0)


def get_operation(event_p: Dict, event_q: Dict) -> Dict:
    # fighters
    blue_p = event_p['blue']
    red_p  = event_p['red']
    blue_q = event_q['blue']
    red_q  = event_q['red']

    # winner
    winner_p = event_p['won']
    winner_q = event_q['won']

    # method
    submission_p = event_p['submission']
    submission_q = event_q['submission']

    knockout_p = event_p['knockout']
    knockout_q = event_q['knockout']

    decision_p = event_p['decision']
    decision_q = event_q['decision']

    split_decision_p = event_p['split_decision']
    split_decision_q = event_q['split_decision']

    unanimous_decision_p = event_p['unanimous_decision']
    unanimous_decision_q = event_q['unanimous_decision']

    m = Model()

    p = m.addVar(vtype=GRB.BINARY)
    q = m.addVar(vtype=GRB.BINARY)

    methods_blue_p = p * blue_p * quicksum([submission_p, knockout_p, decision_p])
    methods_red_p  = p * red_p * quicksum([submission_p, knockout_p, decision_p])

    methods_blue_q = q * blue_q * quicksum([submission_q, knockout_q, decision_q])
    methods_red_q  = q * red_q * quicksum([submission_q, knockout_q, decision_q])

    # winner (NAND not XOR because some events don't include information about the winner)
    # red winner | red winner
    # ---|---|---
    #  1 | 1 | 0
    #  1 | 0 | 1
    #  0 | 1 | 1
    #  0 | 0 | 1

    m.addConstr(p * winner_p * blue_p + q * winner_q * red_q <= 1)
    m.addConstr(p * winner_p * red_p + q * winner_q * blue_q <= 1)

    m.addConstr(p * submission_p + q * knockout_q + q * decision_q <= 1)
    m.addConstr(p * knockout_p + q * submission_q + q * decision_q <= 1)
    m.addConstr(p * decision_p + q * knockout_q + q * submission_q <= 1)
    m.addConstr(p * submission_p + p * knockout_p + q * decision_q <= 1)
    m.addConstr(p * knockout_p + p * submission_p + q * decision_q <= 1)
    m.addConstr(p * decision_p + p * knockout_p + q * submission_q <= 1)


    # method and winner (LTRUE not IMPLIES because some events don't include information about the victory method)
    # method | winner
    # ---|---|---
    #  1 | 1 | 1
    #  1 | 0 | 1
    #  0 | 1 | 1
    #  0 | 0 | 1

    m.addConstr(methods_blue_p + winner_q * blue_q >= 0)
    m.addConstr(methods_red_p + winner_q * red_q >= 0)
    m.addConstr(methods_blue_q + winner_p * blue_p >= 0)
    m.addConstr(methods_red_q + winner_p * red_p >= 0)


    # type of decision (NAND)
    # split decision | unanimous decision  |
    # ---|---|---
    #  1 | 1 | 0
    #  1 | 0 | 1
    #  0 | 1 | 1
    #  0 | 0 | 1

    m.addConstr(p * split_decision_p + q * unanimous_decision_q <= 1)
    m.addConstr(p * unanimous_decision_p + q * split_decision_q <= 1)

    """
    
    # decision (IMPLIES)
    # split/unanimous decision | decision
    # ---|---|---
    #  1 | 1 | 1
    #  1 | 0 | 0
    #  0 | 1 | 1
    #  0 | 0 | 1
    
    m.addConstr(p * split_decision_p <= q * decision_q)
    m.addConstr(p * unanimous_decision_p <= q * decision_q)
    m.addConstr(q * split_decision_q <= p * decision_p)
    m.addConstr(q * unanimous_decision_q <= p * decision_p)
    
    # duration
    m.addGenConstrIndicator(p, True, r_p_min <= r)
    m.addGenConstrIndicator(p, True, r <= r_p_max)
    
    
    m.addGenConstrIndicator(q, True, r_q_min <= r)
    m.addGenConstrIndicator(q, True, r <= r_q_max)
    
    # how to define constraints for when p and / or q are zero?
    """

    m.update()

    m.Params.PoolSearchMode = 2
    m.optimize()

    for s in range(m.SolCount):
        m.setParam(GRB.Param.SolutionNumber, s)
        truth_table[p.Xn, q.Xn] = 1

    return truth_table




p_id = 8
q_id = 9

if __name__ == "__main__":
    event_p = get_market(market_id=p_id)
    event_q = get_market(market_id=q_id)

    operation = get_operation(event_p=event_p, event_q=event_q)
    print(operation)