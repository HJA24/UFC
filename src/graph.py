import os
import json
import numpy as np
import pandas as pd
import networkx as nx
from networkx.readwrite import json_graph
import gurobipy as grb
from gurobipy import GRB
from typing import Any, Dict, List, Union


PATH_EDGES = '/Users/huibmeulenbelt/PycharmProjects/ufc/scripts/markov/graphs/'


def relabel(G: nx.DiGraph, mapping: Dict) -> nx.DiGraph:
    return nx.relabel_nodes(G=G, mapping=mapping)


def connected(data: Union[nx.Graph, pd.DataFrame], nodes: List[int]) -> bool:
    s, t = nodes

    if isinstance(data, pd.DataFrame):
        G = nx.from_pandas_edgelist(
            df=data,
            source='blue',
            target='red',

        )
    else:
        G = nx.DiGraph(data)

    return s in list(nx.node_connected_component(G=G, n=t))


def n_neighbors(G: nx.Graph, node: int) -> int:
    return len([n for n in G.neighbors(node)])


def build_T(G: nx.MultiDiGraph) -> np.ndarray:
    nodes   = list(G.nodes)
    n_nodes = len(nodes)

    df      = nx.to_pandas_edgelist(G=G, nodelist=nodes)
    samples = df['sample_id'].unique()
    idx     = [
        'sample_id',
        'source',
        'target',
    ]

    T = df.set_index(idx).reindex(
            pd.MultiIndex.from_product([
                samples,
                nodes,
                nodes,
            ])
    )['weight'].fillna(0).to_numpy()

    return T.reshape(-1, n_nodes, n_nodes)


def save_G(G: nx.MultiDiGraph, fight_id: int) -> None:
    data = json_graph.adjacency_data(G)

    with open(f'{fight_id}.json', 'w') as f:
        json.dump(data, f)


def build_G(edges: List[Dict], graph_id: int, **kwargs: Any) -> nx.MultiDiGraph:
    n_samples = kwargs.get('n_samples', 4000)

    data = json.load(open(os.path.join(PATH_EDGES, f'{graph_id}.json')))

    for edge in edges:
        data['edges'].extend([
            {'source': edge['u'],
             'target': edge['v'],
             'weight': edge['weight'][s],
             'sample_id': s + 1
            } for s in range(n_samples)
        ])

    return nx.node_link_graph(data=data, edges='edges')


def update_G(G: nx.Graph, A: int, B: int, thresh: int) -> List[int]:
    with grb.Env(empty=True) as env:
        env.setParam('OutputFlag', 0)
        env.start()

        with grb.Model(env=env) as m:
            G = nx.DiGraph(G)

            nodes    = list(G.nodes)
            n_nodes  = len(nodes)
            capacity = nx.get_edge_attributes(G, 'n')

            N        = m.addMVar(n_nodes, vtype=GRB.BINARY)
            max_flow = m.addVar(vtype=GRB.INTEGER, lb=0)

            edges = {
                (u, v): m.addVar(vtype=GRB.INTEGER, ub=capacity.get((u, v), 1))
                for u, v in G.edges()
            }

            for n in nodes:
                inbounds  = list(G.in_edges(n))
                outbounds = list(G.out_edges(n))

                if n == A:
                    m.addConstr(max_flow <= grb.quicksum(edges[e] for e in outbounds) - grb.quicksum(edges[e] for e in inbounds))

                elif n == B:
                    m.addConstr(max_flow <= grb.quicksum(edges[e] for e in inbounds) - grb.quicksum(edges[e] for e in outbounds))

                else:
                    m.addConstr(grb.quicksum(edges[e] for e in outbounds) == grb.quicksum(edges[e] for e in inbounds))

            for u, v in edges:
                m.addConstr(edges[u, v] <= N[nodes.index(v)])
                m.addConstr(edges[u, v] <= N[nodes.index(u)])

            m.addConstr(N[nodes.index(A)] == 1)
            m.addConstr(N[nodes.index(B)] == 1)
            m.addConstr(N.sum() == thresh)

            m.setObjective(max_flow, grb.GRB.MAXIMIZE)
            m.optimize()

            n_solutions = m.SolCount
            print(f'number of solutions: {n_solutions}')

            if m.Status in [GRB.INFEASIBLE, GRB.INF_OR_UNBD]:
                raise ValueError('No solutions - model is not feasible')

            return [n for n in nodes if N[nodes.index(n)].Xn > 0.5]
