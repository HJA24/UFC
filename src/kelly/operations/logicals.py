from enum import auto, Enum


class Logicals(Enum):
    NOT    = auto()
    AND    = auto()
    NAND   = auto()
    OR     = auto()
    NOR    = auto()
    XOR    = auto()
    XNOR   = auto()
    EQUIV  = auto()
    LTRUE  = auto()
    IMPLY  = auto()
    INCOMP = auto()
    NULL   = auto()

    @classmethod
    def from_bools(cls, bools):
        return {
            (0, 0, 0, 0):  cls.INCOMP,
            (0, 0, 1, 1):  cls.NOT,
            (1, 0, 0, 0):  cls.AND,
            (0, 1, 1, 1):  cls.NAND,
            (1, 1, 1, 0):  cls.OR,
            (0, 0, 0, 1):  cls.NOR,
            (0, 1, 1, 0):  cls.XOR,
            (1, 0, 0, 1):  cls.EQUIV,
            (1, 0, 1, 1):  cls.IMPLY,
            (1, 1, 1, 1):  cls.LTRUE
        }.get(bools, cls.NULL)