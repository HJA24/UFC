import networkx as nx
from dataclasses import dataclass
from typing import Dict, List


@dataclass
class Node:
    node_id: int
    G:       nx.Graph()
    pos:     List[float]
    color:   str

    def to_dict(self) -> Dict:
        return {
            'node_id':   self.node_id,
            'pos_x':     self.pos[0],
            'pos_y':     self.pos[1],
            'pos_theta': self.pos[2],
            'color':     self.color
        }

    @property
    def degree_centrality(self) -> float:
        return nx.degree_centrality(self.G)[self.node_id]

    @property
    def clustering (self) -> float:
        return nx.clustering(self.G, weight='weight')[self.node_id]

    @property
    def closeness(self) -> float:
        return nx.closeness_centrality(self.G)[self.node_id]

    @property
    def efficiency(self) -> float:
        n = self.G.number_of_nodes()

        lengths = nx.single_source_shortest_path_length(self.G, self.node_id)
        return sum(
            1 / d for target, d in lengths.items()
            if target != self.node_id and d > 0
        ) / (n - 1)
