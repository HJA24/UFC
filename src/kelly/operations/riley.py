import gurobipy as gp
from logicals import Logicals
from typing import List


class Builder:
    def __init__(self, model: gp.Model, temporary=False):
        self.m = model
        self.temporary = temporary
        self.to_remove = []

    def register(self, obj):
        if self.temporary:
            self.to_remove.append(obj)
        return obj

    def addBin(self, name="", ignore_pool=True):
        v = self.register(self.m.addVar(vtype="B", name=name))
        v.PoolIgnore = int(ignore_pool)
        return v

    def OR(self, x, y):
        """ w = OR(x,y)  """
        w = self.register(self.addBin())
        self.register(self.m.addConstr(x <= w))
        self.register(self.m.addConstr(y <= w))
        self.register(self.m.addConstr(w <= x + y))
        return w

    def AND(self, x, y):
        """ w = AND(x,y) """
        w = self.register(self.addBin())
        self.register(self.m.addConstr(w <= x))
        self.register(self.m.addConstr(w <= y))
        self.register(self.m.addConstr(x + y <= w + 1))
        return w

    def NAND(self, x, y):
        """ w = NAND(x,y), aka 'not both' """
        w = self.register(self.addBin())
        self.register(self.m.addConstr(1 <= x + w))
        self.register(self.m.addConstr(1 <= y + w))
        self.register(self.m.addConstr(x + y + w <= 2))
        return w

    def XOR(self, x, y):
        """ w = XOR(x,y) """
        w = self.register(self.addBin())
        self.register(self.m.addConstr(w <= x + y))
        self.register(self.m.addConstr(y <= x + w))
        self.register(self.m.addConstr(x <= y + w))
        self.register(self.m.addConstr(x + y + w <= 2))
        return w

    def XOR3(self, x, y, z):
        """ w = XOR(x,y, z) """
        w = self.register(self.addBin())
        self.register(self.m.addConstr(x + y + z - 2 * w <= 1))
        self.register(self.m.addConstr(x + y + z - 2 * w >= 0))
        return w

    def NOT(self, x):
        """ w = not x """
        w = self.register(self.addBin())
        self.register(self.m.addConstr(w == 1 - x))
        return w

    def IMPLIES(self, x, y):
        """ w = x implies y """
        w = self.register(self.addBin())
        self.register(self.m.addConstr(1 <= w + x))
        self.register(self.m.addConstr(y <= w))
        self.register(self.m.addConstr(x + w <= y + 1))
        return w

    def EQUIVALENT(self, x, y):
        """ w = x equivalent to y, aka NOT XOR """
        w = self.register(self.addBin())
        self.register(self.m.addConstr(1 <= w + x + y))
        self.register(self.m.addConstr(y + w <= x + 1))
        self.register(self.m.addConstr(x + w <= y + 1))
        self.register(self.m.addConstr(x + y <= w + 1))
        return w

    def DECLARE(self, x):
        """ x is true """
        return self.register(self.m.addConstr(x == 1))


class Category:
    def __init__(self, builder):
        self.outcome   = builder.addBin('outcome')                             # blue is winner
        self.stats     = builder.addBin('stats')                               # blue has more takedowns
        self.duration  = builder.addBin('duration')                            # fight lasts more than 1.5 rounds
        builder.DECLARE(builder.XOR3(self.outcome, self.stats, self.duration))


class Fighter:
    def __init__(self, builder):
        self.is_red  = builder.addBin()
        self.is_blue = builder.addBin()
        builder.DECLARE(builder.XOR(self.is_blue, self.is_red))

        self.is_winner = builder.addBin()
        self.is_loser  = builder.addBin()
        builder.DECLARE(builder.NAND(self.is_winner, self.is_loser))


class Method:
    def __init__(self, builder):
        self.is_knockout   = builder.addBin('method_is_knockout')
        self.is_submission = builder.addBin('method_is_submission')
        self.is_decision   = builder.addBin('method_is_decision')
        builder.DECLARE(builder.XOR3(self.is_knockout, self.is_submission, self.is_decision))


class Decision:
    def __init__(self, builder):
        self.is_unanimous = builder.addBin('deicison_is_unanimous')
        self.is_split     = builder.addBin('decision_is_split')
        builder.DECLARE(builder.XOR(self.is_unanimous, self.is_split))


class LogicalModel:
    def __init__(self, model: gp.Model):
        self._model = model
        self._builder = Builder(model)
        self._temporary_builder = Builder(model, temporary=True)
        self._build_model()

    def get_builder(self):
        return self._temporary_builder

    def _addBin(self, name):
        v = self._builder.addBin(name)
        self.__setattr__(name, v)
        return v

    def same_fighter(self, fighterA, fighterB, temporary=False):
        bd = self._temporary_builder if temporary else self._builder
        v1 = bd.EQUIVALENT(fighterA.is_winner, fighterB.is_winner)
        v2 = bd.EQUIVALENT(fighterA.is_loser,  fighterB.is_loser)
        v3 = bd.EQUIVALENT(fighterA.is_red,    fighterB.is_red)
        v4 = bd.EQUIVALENT(fighterA.is_blue,   fighterB.is_blue)

        return bd.AND(bd.AND(bd.AND(v1, v2), v3), v4)

    def add_category(self, temporary=True):
        bd = self._temporary_builder if temporary else self._builder
        category = Category(bd)

        bd.DECLARE(bd.EQUIVALENT(self.exists_winner, category.outcome))

        return category

    def add_fighter(self, temporary=True):
        bd = self._temporary_builder if temporary else self._builder
        fighter = Fighter(bd)

        bd.DECLARE(bd.EQUIVALENT(self.exists_winner, bd.XOR(fighter.is_winner, fighter.is_loser)))

        try:
            bd.DECLARE(bd.EQUIVALENT(fighter.is_blue, self.same_fighter(fighter, self.blue_fighter)))
            bd.DECLARE(bd.EQUIVALENT(fighter.is_red,  self.same_fighter(fighter, self.red_fighter)))
        except AttributeError:
            pass

        return fighter

    def add_method(self, temporary=True):
        bd = self._temporary_builder if temporary else self._builder
        method = Method(bd)

        bd.DECLARE(bd.EQUIVALENT(self.method_known, bd.XOR3(method.is_knockout, method.is_submission, method.is_decision)))
        return method

    def _build_model(self):
        bd = self._builder
        addBin = self._addBin

        self.exists_winner = addBin("exists_winner")
        self.method_known  = addBin("method_known")

        self.blue_fighter = self.add_fighter(temporary=False)
        bd.DECLARE(self.blue_fighter.is_blue)

        self.red_fighter = self.add_fighter(temporary=False)
        bd.DECLARE(self.red_fighter.is_red)

        bd.DECLARE(bd.EQUIVALENT(self.blue_fighter.is_winner, self.red_fighter.is_loser))
        bd.DECLARE(bd.EQUIVALENT(self.blue_fighter.is_loser,  self.red_fighter.is_winner))

    def solve(self, p_statements: List[gp.Var], q_statements: List[gp.Var]):
        bd = self._temporary_builder
        p = bd.addBin(ignore_pool=False)
        q = bd.addBin(ignore_pool=False)

        for p_statement in p_statements:
            bd.DECLARE(bd.EQUIVALENT(p, p_statement))

        for q_statement in q_statements:
            bd.DECLARE(bd.EQUIVALENT(q, q_statement))

        self._model.params.PoolSearchMode = 2
        self._model.params.OutputFlag = 0

        self._model.optimize()

        result = {
            (1, 1): 0,
            (1, 0): 0,
            (0, 1): 0,
            (0, 0): 0
        }

        for s in range(self._model.SolCount):
            self._model.params.SolutionNumber = s
            result[p.Xn, q.Xn] = 1

        return Logicals.from_bools(tuple(result.values()))


model         = gp.Model()
logical_model = LogicalModel(model)
builder       = logical_model.get_builder()


# p = blue wins (by submission)
# q = red loses

category_p = logical_model.add_category(temporary=True)
category_q = logical_model.add_category(temporary=True)

fighter_p = logical_model.add_fighter(temporary=True)
fighter_q = logical_model.add_fighter(temporary=True)

method_p = logical_model.add_method(temporary=True)
method_q = logical_model.add_method(temporary=True)


sol = logical_model.solve(
    p_statements=[
        category_p.outcome,
        fighter_p.is_blue,
        fighter_p.is_winner,
        # method_p.is_submission
    ],
    q_statements=[
        category_q.outcome,
        fighter_q.is_red,
        fighter_q.is_winner
    ]
)
print(sol)
>> Logicals.NOR

print(sol)