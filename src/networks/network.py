import numpy as np
import networkx as nx
from networkx.algorithms import community
from dataclasses import dataclass, field
from matchups import Matchups
from node import Node
from property_types import *
from typing import Dict, Optional, List


@dataclass
class Network:
    fight_id: int
    G:        nx.Graph()
    u:        int
    v:        int

    nodes: Dict[int, Node] = field(init=False, default_factory=dict)
    edges: List[Dict]      = field(init=False, default_factory=list)

    def __post_init__(self):
        # Compute clusters first (needed for hierarchical positioning)
        clusters, communities = self.build_clusters()
        colors = self.build_colors()
        pos = self.build_pos(communities)

        for node in self.G.nodes():
            self.nodes[node] = Node(
                node_id=node,
                G=self.G,
                pos=pos[node],
                color=colors[node],
                cluster=clusters[node]
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
    def density(self) -> float:
        return nx.density(self.G)

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

    def build_pos(self, communities: List[set]) -> Dict:
        """
        Build node positions using a hierarchical two-level layout:
        1. Position cluster centers using spring layout on a supergraph
        2. Position nodes within each cluster around their center

        Also computes theta values for circular layout.
        """
        n = self.n_nodes
        m = n // 2

        # Compute theta values for circular layout
        l = np.linspace(0, np.pi, m, endpoint=False)
        u_thetas = np.linspace(np.pi, 2 * np.pi, n - m, endpoint=False)[::-1]
        thetas = np.concatenate([l, u_thetas])

        # --- Hierarchical cluster layout for x, y positions ---
        n_clusters = len(communities)

        if n_clusters <= 1:
            # Single cluster or no clusters - use simple spring layout
            pos = nx.random_layout(self.G, seed=42)
            pos[self.u] = (-1, 0)
            pos[self.v] = (1, 0)
            pos = nx.spring_layout(self.G, pos=pos, fixed=[self.u, self.v], seed=42)
        else:
            # Stage 1: Create supergraph of clusters and position cluster centers
            supergraph = nx.Graph()
            supergraph.add_nodes_from(range(n_clusters))

            # Add edges between clusters based on inter-cluster connections
            for i, comm_i in enumerate(communities):
                for j, comm_j in enumerate(communities):
                    if i < j:
                        # Count edges between clusters
                        weight = sum(
                            1 for node_i in comm_i
                            for node_j in comm_j
                            if self.G.has_edge(node_i, node_j)
                        )
                        if weight > 0:
                            supergraph.add_edge(i, j, weight=weight)

            # Position cluster centers
            superpos = nx.spring_layout(supergraph, scale=0.7, seed=42)
            centers = [superpos[i] for i in range(n_clusters)]

            # Stage 2: Position nodes within each cluster around their center
            pos = {}
            for cluster_id, comm in enumerate(communities):
                center = centers[cluster_id]
                subgraph = self.G.subgraph(comm)

                # Scale based on cluster size
                scale = min(0.3, 0.1 + 0.02 * len(comm))

                cluster_pos = nx.spring_layout(
                    subgraph,
                    center=center,
                    scale=scale,
                    seed=42
                )
                pos.update(cluster_pos)

        # Combine x, y positions with theta values
        return {
            node: {
                "x": pos[node][0],
                "y": pos[node][1],
                "theta": theta,
            }
            for node, theta in zip(self.G.nodes, thetas)
        }


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

    def build_clusters(self) -> tuple[Dict[int, int], List[set]]:
        """
        Detect communities in the graph using the Louvain algorithm.
        Returns:
            - clusters: dict mapping node_id -> cluster_id
            - communities: list of sets, each set contains node_ids in that cluster
        """
        if self.n_nodes < 2:
            return {n: 0 for n in self.G.nodes()}, [set(self.G.nodes())]

        # Use Louvain community detection (greedy modularity optimization)
        communities = community.louvain_communities(self.G, weight='weight', seed=42)

        # Map each node to its cluster index
        clusters = {}
        for cluster_id, community_nodes in enumerate(communities):
            for node in community_nodes:
                clusters[node] = cluster_id

        return clusters, list(communities)

    def extract_properties(self) -> List[Dict]:
        properties_mapping = [
            (self.density,      GraphPropertyType.DENSITY),
            (self.clustering,   GraphPropertyType.CLUSTERING),
            (self.transitivity, GraphPropertyType.TRANSITIVITY),
            (self.efficiency,   GraphPropertyType.EFFICIENCY),
            (self.connectivity, GraphPropertyType.CONNECTIVITY),
        ]

        properties: List[Dict] = []

        for value, property_type_id in properties_mapping:
            property = {
                'property_type_id': property_type_id,
                'value': value
            }

            properties.append(property)

        return properties


    def to_dict(self) -> Dict:
        return {
            'fight_id':     self.fight_id,
            'nodes':       [node.to_dict() for node in self.nodes.values()],
            'edges':        self.edges,
            'is_connected': self.is_connected(),
            'properties':   self.extract_properties()
        }