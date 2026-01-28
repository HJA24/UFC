import numpy as np
import networkx as nx
from dataclasses import dataclass, field
from matchups import Matchups
from node import Node
from property_types import *
from typing import Dict, Optional, List


@dataclass
class Network:
    fight_id: int
    G:        nx.Graph()
    u:        Optional[int] = None
    v:        Optional[int] = None

    nodes: Dict[int, Node] = field(init=False, default_factory=dict)
    edges: List[Dict]      = field(init=False, default_factory=list)

    def __post_init__(self):
        pos    = self.build_pos()
        colors = self.build_colors()

        for node in self.G.nodes():
            self.nodes[node] = Node(
                node_id=node,
                G=self.G,
                pos=pos[node],
                color=colors[node]
            )

        self.edges = [
            {
                'source': u,
                'target': v,
                'weight': weight
            } for u, v, weight in self.G.edges.data('weight')
        ]

    @classmethod
    def from_matchups(
            cls,
            matchups: Matchups
    ):
        df = (
            matchups.fights.groupby(['fighter_id', 'opponent_id'], as_index=False)
            .size()
        )

        G = nx.Graph()

        G.add_nodes_from(matchups.fighters)
        G.add_weighted_edges_from(
            df[['fighter_id', 'opponent_id', 'size']].itertuples(index=False)
        )

        return cls(
            fight_id=matchups.fight_id,
            u=matchups.fighter_id_blue,
            v=matchups.fighter_id_red,
            G=G
        )

    @property
    def n_nodes(self) -> int:
        return self.G.number_of_nodes()

    @property
    def n_edges(self) -> int:
        return self.G.size()

    @property
    def clustering(self) -> float:
        return nx.average_clustering(self.G, weight='weight')

    @property
    def transitivity(self) -> float:
        return nx.transitivity(self.G)

    @property
    def efficiency(self) -> float:
        return nx.global_efficiency(self.G)

    @property
    def connectivity(self) -> float:
        largest_connected_component = max(nx.connected_components(self.G), key=len)

        return len(largest_connected_component) / self.n_nodes

    def relabel(self, labels: Dict) -> None:
        self.G = nx.relabel_nodes(G=self.G, mapping=labels)

    def is_connected(self) -> bool:
        if self.u is None or self.v is None:
            raise ValueError("Both u and v must be set to check their connectivity")

        return self.u in list(nx.node_connected_component(G=self.G, n=self.v))

    def build_pos(self) -> Dict:
        n = self.n_nodes
        m = n // 2

        l = np.linspace(0, np.pi, m, endpoint=False)
        u = np.linspace(np.pi, 2 * np.pi, n - m, endpoint=False)[::-1]

        thetas = np.concatenate([l, u])
        pos    = np.column_stack((np.cos(thetas), np.sin(thetas), thetas)).tolist()

        return dict(zip(self.G.nodes, pos))

    def build_colors(self) -> Dict:
        colors = {
            n: (
                'BLUE' if n == self.u else
                'RED'  if n == self.v else
                None
            )
            for n in self.G.nodes()
        }

        return colors

    def extract_properties(self) -> Dict[str, List[Dict]]:
        u = self.nodes[self.u]
        v = self.nodes[self.v]

        properties = [
            (self.clustering,     None,      GraphPropertyType.CLUSTERING,       PropertyCategory.GRAPH),
            (self.transitivity,   None,      GraphPropertyType.TRANSITIVITY,     PropertyCategory.GRAPH),
            (self.efficiency,     None,      GraphPropertyType.EFFICIENCY,       PropertyCategory.GRAPH),
            (self.connectivity,   None,      GraphPropertyType.CONNECTIVITY,     PropertyCategory.GRAPH),
            (u.degree_centrality, u.node_id, NodePropertyType.DEGREE_CENTRALITY, PropertyCategory.NODE),
            (u.clustering,        u.node_id, NodePropertyType.CLUSTERING,        PropertyCategory.NODE),
            (u.closeness,         u.node_id, NodePropertyType.CLOSENESS,         PropertyCategory.NODE),
            (u.efficiency,        u.node_id, NodePropertyType.EFFICIENCY,        PropertyCategory.NODE),
            (v.degree_centrality, v.node_id, NodePropertyType.DEGREE_CENTRALITY, PropertyCategory.NODE),
            (v.clustering,        v.node_id, NodePropertyType.CLUSTERING,        PropertyCategory.NODE),
            (v.closeness,         v.node_id, NodePropertyType.CLOSENESS,         PropertyCategory.NODE),
            (v.efficiency,        v.node_id, NodePropertyType.EFFICIENCY,        PropertyCategory.NODE),

        ]

        graph_properties: List[Dict] = []
        node_properties:  List[Dict] = []

        for value, node_id, property_type_id, category in properties:
            property = {
                'property_type_id': property_type_id,
                'node_id': node_id,
                'value': value
            }

            if category == PropertyCategory.GRAPH:
                del property['node_id']
                graph_properties.append(property)

            elif category == PropertyCategory.NODE:
                node_properties.append(property)

        return {
            'graph-data': graph_properties,
            'node':  node_properties
        }

    def to_dict(self) -> Dict:
        return {
            'fight_id':     self.fight_id,
            'nodes':       [node.to_dict() for node in self.nodes.values()],
            'edges':        self.edges,
            'is_connected': self.is_connected(),
            'properties':   self.extract_properties()
        }