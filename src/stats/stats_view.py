from dataclasses import dataclass
from stats.stats_type import StatsType
from typing import Callable, Dict, Iterable, Tuple
from helper import Corner, CountType


@dataclass(frozen=True)
class StatsView:
    items:     Iterable[StatsType]
    hierarchy: Dict[StatsType, Tuple[StatsType, ...]]

    @classmethod
    def from_enum(cls, enum_cls, hierarchy):
        return cls(enum_cls, hierarchy)

    def where(self, pred: Callable[[StatsType], bool]):
        return StatsView(tuple(x for x in self.items if pred(x)), self.hierarchy)

    def blue(self):
        return self.where(lambda x: x.fighter is Corner.BLUE)

    def red(self):
        return self.where(lambda x: x.fighter is Corner.RED)

    def attempted(self):
        return self.where(
            lambda x: getattr(x, 'count_type', None) is CountType.TRIALS
        )

    def landed(self):
        return self.where(
            lambda x: getattr(x, 'count_type', None) is CountType.SUCCESSES
        )

    def children_of(self, parent: StatsType):
        return StatsView(self.hierarchy.get(parent, ()), self.hierarchy)

    def all(self) -> Tuple[StatsType, ...]:
        return tuple(self.items)



