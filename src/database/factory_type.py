from enum import Enum


class FactoryType(Enum):
    DICT     = 0
    LIST     = 1
    SET      = 2
    NDARRAY  = 3
    DATETIME = 4