import gurobipy as grb


class Constraints:
    def __init__(self, model: grb.Model):
        self.m = model

    def NOT(self, x):
        """ z = not x """
        z = self.m.addVar(vtype=grb.GRB.BINARY)

        self.m.addConstr(z == 1 - x)

        return z

    def AND(self, x, y):
        """ z = AND(x, y) """
        z = self.m.addVar(vtype=grb.GRB.BINARY)

        self.m.addConstr(z <= x)
        self.m.addConstr(z <= y)
        self.m.addConstr(x + y <= z + 1)

        return z

    def NAND(self, x, y):
        """ z = NAND(x, y) """
        z = self.m.addVar(vtype=grb.GRB.BINARY)

        self.m.addConstr(1 <= x + z)
        self.m.addConstr(1 <= y + z)
        self.m.addConstr(x + y + z <= 2)

        return z

    def OR(self, x, y):
        """ z = OR(x, y)  """
        z = self.m.addVar(vtype=grb.GRB.BINARY)

        self.m.addConstr(x <= z)
        self.m.addConstr(y <= z)
        self.m.addConstr(z <= x + y)

        return z

    def NOR(self, x, y):
        """ z = NOT(x V y)  """
        z = self.m.addVar(vtype=grb.GRB.BINARY)

        self.m.addConstr(z <= 1 - x)
        self.m.addConstr(y <= 1 - y)
        self.m.addConstr(z >= x - y)

        return z

    def XOR(self, x, y):
        """ z = XOR(x, y) """
        z = self.m.addVar(vtype=grb.GRB.BINARY)

        self.m.addConstr(z <= x + y)
        self.m.addConstr(y <= x + z)
        self.m.addConstr(x <= y + z)
        self.m.addConstr(x + y + z <= 2)

        return z

    def XNOR(self, x, y):
        """ z = XNOR(x, y) """
        z = self.m.addVar(vtype=grb.GRB.BINARY)
        w = self.m.addVar(vtype=grb.GRB.BINARY)

        self.m.addConstr(w >= x - y)
        self.m.addConstr(w <= y + x)
        self.m.addConstr(w <= x + y)
        self.m.addConstr(w <= 2 - x - y)

        self.m.addConstr(z <= 1 - w)

        return z

    def IMPLY(self, x, y):
        """ x implies y """
        z = self.m.addVar(vtype=grb.GRB.BINARY)

        self.m.addConstr(z >= y)
        self.m.addConstr(z >= 1 - x)
        self.m.addConstr(z <= 1 - x + y)

        return z

    def EQUIV(self, x, y):
        """ x equivalent to y """
        z = self.m.addVar(vtype=grb.GRB.BINARY)

        self.m.addConstr(1 <= z + x + y)
        self.m.addConstr(y + z <= x + 1)
        self.m.addConstr(x + z <= y + 1)
        self.m.addConstr(x + y <= z + 1)

        return z