from enum import auto, Flag
from typing import Any


class Category(Flag):
    WINNER   = auto()                                    # blue wins in round 1
    DURATION = auto()                                    # fight starts round 4
    STATS    = auto()                                    # red has more significant strikes in round 5


class Fighter(Flag):
    BLUE    = auto()                                     # blue wins
    RED     = auto()                                     # red wins
    NONE    = auto()                                     # fight ends in submission in round 1


class Method(Flag):
    KNOCKOUT   = auto()                                  # blue wins by TKO/KO via kick
    SUBMISSION = auto()                                  # blue wins by submission
    DECISION   = auto()                                  # blue wins by split/majority decision
    UNKNOWN    = KNOCKOUT ^ SUBMISSION ^ DECISION        # blue wins in round 1


class Decision(Flag):
    SPLIT     = auto()                                   # blue wins by split/majority decision
    UNANIMOUS = auto()                                   # blue wins by unanimous decision
    UNKNOWN   = SPLIT ^ UNANIMOUS                   # blue wins by decision
    NONE      = auto()


class Round(Flag):
    R1      = 1                                     # blue wins by submission in round 1
    R2      = 2                                     # blue wins by submission in round 2
    R3      = 3                                     # blue wins by submission in round 3
    R4      = 4                                     # blue wins by submission in round 4
    R5      = 5                                     # blue wins by submission in round 5
    INSIDE  = R1 | R2 | R3 | R4 | R5
    JUDGES  = 6                                     # blue wins by split/majority decision
    UNKNOWN = R1 ^ R2 ^ R3 ^ R4 ^ R5 ^ JUDGES


class MinRound(Flag):
    R1     = auto()                                      # blue wins by submission in round 1
    R2     = auto()                                      # blue wins by submission in round 2
    R3     = auto()                                      # blue wins by submission in round 3
    R4     = auto()                                      # blue wins by submission in round 4
    R5     = auto()                                      # blue wins by submission in round 5
    JUDGES = auto()                                      # blue wins by split/majority decision


class MaxRound(Flag):
    R1     = auto()                                      # blue wins by submission in round 1
    R2     = auto()                                      # blue wins by submission in round 2
    R3     = auto()                                      # blue wins by submission in round 3
    R4     = auto()                                      # blue wins by submission in round 4
    R5     = auto()                                      # blue wins by submission in round 5
    JUDGES = auto()                                      # blue wins by split/majority decision


class Outcome():
    def __init__(self, blocks):
        self.enums = [Category, Fighter, Method, Decision, Round]

        for enum, block in zip(self.enums, blocks):
            setattr(self, block, enum[blocks[block]])


    """
    self.fighter  = Fighter[fighter]
    self.method   = Method[method]
    self.decision = Decision[decision]
    self.round    = Round[round]
    """


blue_wins_by_knockout_in_R1 = {
    'category': 'WINNER',
    'fighter': 'BLUE',
    'method': 'UNKNOWN',
    'decision': 'NONE',
    'round': 'INSIDE'
}

outcome = Outcome(blue_wins_by_knockout_in_R1)
a = 1