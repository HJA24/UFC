import itertools
import gurobipy as grb
from gurobipy import GRB, Model
from typing import Dict


def get_operation(event_p: Dict, event_q: Dict) -> Dict:
    truth_table = dict.fromkeys(itertools.product([1, 0], repeat=2), 0)

    # fighters
    blue_p = event_p['blue']
    red_p  = event_p['red']
    blue_q = event_q['blue']
    red_q  = event_q['red']

    # winner
    winner_p = event_p['won']
    winner_q = event_q['won']

    # method of victory
    submission_p = event_p['submission']
    submission_q = event_q['submission']
    knockout_p   = event_p['knockout']
    knockout_q   = event_q['knockout']
    decision_p   = event_p['decision']
    decision_q   = event_q['decision']

    # decisions
    split_decision_p = event_p['split_decision']
    split_decision_q = event_q['split_decision']
    unanimous_decision_p = event_p['unanimous_decision']
    unanimous_decision_q = event_q['unanimous_decision']

    with grb.Env(empty=True) as env:
        env.setParam('OutputFlag', 0)
        env.start()

        with Model(env=env) as m:
            p = m.addVar(vtype=GRB.BINARY)
            q = m.addVar(vtype=GRB.BINARY)

            blue_won_p = m.addVar(vtype=GRB.BINARY)
            red_won_p  = m.addVar(vtype=GRB.BINARY)
            blue_won_q = m.addVar(vtype=GRB.BINARY)
            red_won_q  = m.addVar(vtype=GRB.BINARY)

            blue_knockout_p   = m.addVar(vtype=GRB.BINARY)
            blue_submission_p = m.addVar(vtype=GRB.BINARY)
            blue_decision_p   = m.addVar(vtype=GRB.BINARY)
            red_knockout_p    = m.addVar(vtype=GRB.BINARY)
            red_submission_p  = m.addVar(vtype=GRB.BINARY)
            red_decision_p    = m.addVar(vtype=GRB.BINARY)

            blue_knockout_q   = m.addVar(vtype=GRB.BINARY)
            blue_submission_q = m.addVar(vtype=GRB.BINARY)
            blue_decision_q   = m.addVar(vtype=GRB.BINARY)
            red_knockout_q    = m.addVar(vtype=GRB.BINARY)
            red_submission_q  = m.addVar(vtype=GRB.BINARY)
            red_decision_q    = m.addVar(vtype=GRB.BINARY)

            blue_method_p = grb.quicksum([blue_knockout_p, blue_submission_p, blue_decision_p])
            red_method_p  = grb.quicksum([red_knockout_p,  red_submission_p,  red_decision_p])
            blue_method_q = grb.quicksum([blue_knockout_q, blue_submission_q, blue_decision_q])
            red_method_q  = grb.quicksum([red_knockout_q,  red_submission_q,  red_decision_q])

            blue_unanimous_p = m.addVar(vtype=GRB.BINARY)
            blue_split_p     = m.addVar(vtype=GRB.BINARY)
            red_unanimous_p  = m.addVar(vtype=GRB.BINARY)
            red_split_p      = m.addVar(vtype=GRB.BINARY)

            blue_split_q     = m.addVar(vtype=GRB.BINARY)
            blue_unanimous_q = m.addVar(vtype=GRB.BINARY)
            red_split_q      = m.addVar(vtype=GRB.BINARY)
            red_unanimous_q  = m.addVar(vtype=GRB.BINARY)

            # winner
            m.addGenConstrIndicator(p, True, blue_p * winner_p == blue_won_p)
            m.addGenConstrIndicator(p, True, red_p * winner_p  == red_won_p)
            m.addGenConstrIndicator(q, True, blue_q * winner_q == blue_won_q)
            m.addGenConstrIndicator(q, True, red_q * winner_q  == red_won_q)

            m.addConstr(blue_won_p + red_won_q  <= 1)
            m.addConstr(red_won_p  + blue_won_q <= 1)

            # method of victory
            m.addGenConstrIndicator(p, True, blue_p * knockout_p   == blue_knockout_p)
            m.addGenConstrIndicator(p, True, blue_p * submission_p == blue_submission_p)
            m.addGenConstrIndicator(p, True, blue_p * decision_p   == blue_decision_p)
            m.addGenConstrIndicator(p, True, red_p * knockout_p    == red_knockout_p)
            m.addGenConstrIndicator(p, True, red_p * submission_p  == red_submission_p)
            m.addGenConstrIndicator(p, True, red_p * decision_p    == red_decision_p)

            m.addGenConstrIndicator(q, True, blue_q * knockout_q   == blue_knockout_q)
            m.addGenConstrIndicator(q, True, blue_q * submission_q == blue_submission_q)
            m.addGenConstrIndicator(q, True, blue_q * decision_q   == blue_decision_q)
            m.addGenConstrIndicator(q, True, red_q * knockout_q    == red_knockout_q)
            m.addGenConstrIndicator(q, True, red_q * submission_q  == red_submission_q)
            m.addGenConstrIndicator(q, True, red_q * decision_q    == red_decision_q)

            m.addConstr(blue_knockout_p + blue_submission_p + blue_decision_q <= 1)
            m.addConstr(blue_knockout_p + blue_submission_q + blue_decision_q <= 1)
            m.addConstr(blue_knockout_p + blue_submission_q + blue_decision_p <= 1)
            m.addConstr(blue_knockout_q + blue_submission_q + blue_decision_p <= 1)
            m.addConstr(blue_knockout_q + blue_submission_p + blue_decision_p <= 1)
            m.addConstr(blue_knockout_q + blue_submission_p + blue_decision_q <= 1)

            m.addConstr(red_knockout_p + red_submission_p + red_decision_q <= 1)
            m.addConstr(red_knockout_p + red_submission_q + red_decision_q <= 1)
            m.addConstr(red_knockout_p + red_submission_q + red_decision_p <= 1)
            m.addConstr(red_knockout_q + red_submission_q + red_decision_p <= 1)
            m.addConstr(red_knockout_q + red_submission_p + red_decision_p <= 1)
            m.addConstr(red_knockout_q + red_submission_p + red_decision_q <= 1)

            m.addConstr(blue_method_p <= blue_won_q)
            m.addConstr(red_method_p  <= red_won_q)
            m.addConstr(blue_method_q <= blue_won_p)
            m.addConstr(red_method_q  <= red_won_p)

            # decision
            m.addGenConstrIndicator(p, True, blue_p * split_decision_p     == blue_split_p)
            m.addGenConstrIndicator(p, True, blue_p * unanimous_decision_p == blue_unanimous_p)

            m.addGenConstrIndicator(q, True, blue_q * split_decision_q     == blue_split_q)
            m.addGenConstrIndicator(q, True, blue_q * unanimous_decision_q == blue_unanimous_q)

            # unanimous vs split decision (NAND)
            m.addConstr(blue_split_p + blue_unanimous_q <= 1)
            m.addConstr(red_split_p  + red_unanimous_q  <= 1)

            m.addConstr(blue_split_q + blue_unanimous_p <= 1)
            m.addConstr(red_split_q  + red_unanimous_p  <= 1)

            # unanimous or split decision -> decision (IMPL)
            m.addConstr(blue_split_p     <= blue_decision_q)
            m.addConstr(blue_unanimous_p <= blue_decision_q)
            m.addConstr(red_split_p      <= red_decision_q)
            m.addConstr(red_unanimous_p  <= red_decision_q)

            m.addConstr(blue_split_q     <= blue_decision_p)
            m.addConstr(blue_unanimous_q <= blue_decision_p)
            m.addConstr(red_split_q      <= red_decision_p)
            m.addConstr(red_unanimous_q  <= red_decision_p)

            m.update()

            m.Params.PoolSearchMode = 2
            m.optimize()

            for s in range(m.SolCount):
                m.setParam(GRB.Param.SolutionNumber, s)
                truth_table[p.Xn, q.Xn] = 1

            return truth_table

events = [
    {'description': 'blue wins', 'blue': 1, 'red': 0, 'won': 1, 'knockout': 0, 'submission': 0, 'decision': 0, 'split_decision': 0, 'unanimous_decision': 0},
    # {'description': 'blue wins by decision', 'blue': 1, 'red': 0, 'won': 1, 'knockout': 0, 'submission': 0, 'decision': 1, 'split_decision': 0, 'unanimous_decision': 0},
    {'description': 'blue wins by submission', 'blue': 1, 'red': 0, 'won': 1, 'knockout': 0, 'submission': 1,'decision': 0, 'split_decision': 0, 'unanimous_decision': 0},
    # {'description': 'blue wins by split decision', 'blue': 1, 'red': 0, 'won': 1, 'knockout': 0, 'submission': 0, 'decision': 1, 'split_decision': 1, 'unanimous_decision': 0},
    # {'description': 'blue wins by unanimous decision', 'blue': 1, 'red': 0, 'won': 1, 'knockout': 0, 'submission': 0, 'decision': 1, 'split_decision': 0, 'unanimous_decision': 1},
    # {'description': 'red wins', 'blue': 0, 'red': 1, 'won': 1, 'knockout': 0, 'submission': 0, 'decision': 0, 'split_decision': 0, 'unanimous_decision': 0},
]


if __name__ == "__main__":
    for i, event_i in enumerate(events):
        for j, event_j in enumerate(events):
            if i == j:
                continue

            operation = get_operation(event_p=event_i, event_q=event_j)
            print(f"{event_i['description']}, {event_j['description']} - {list(operation.values())}")