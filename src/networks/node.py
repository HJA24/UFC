import networkx as nx
from dataclasses import dataclass
from typing import Dict, List, Optional


@dataclass
class Node:
    node_id: int
    G:       nx.Graph()
    pos:     List[float]
    color:   str
    cluster: int

    def to_dict(self) -> Dict:
        return {
            'node_id':   self.node_id,
            'pos_x':     self.pos['x'],
            'pos_y':     self.pos['y'],
            'pos_theta': self.pos['theta'],
            'color':     self.color,
            'cluster':   self.cluster
        }
