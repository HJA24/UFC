import numpy as np
from dataclasses import dataclass, asdict
from datetime import datetime
from scripts.database.database import insert_edges, get_edge_ids, get_u_and_v, get_weight
from typing import Any, Dict, List


@dataclass
class Edge:
    fight_id:   int
    edge_id:    int
    weight:     bytes
    model_id:   int
    ts:         int

    def to_dict(self):
        return asdict(self)


def build_weights(skills: Dict) -> Dict:
    ssr_blue = skills['ssr_blue']
    ssr_red  = skills['ssr_red']
    sgr_blue = skills['sgr_blue']
    sgr_red  = skills['sgr_red']
    
    tdr_blue = skills['tdr_blue']
    tdr_red  = skills['tdr_red']
    smr_blue = skills['smr_blue']
    smr_red  = skills['smr_red']
    rvr_blue = skills['rvr_blue']
    rvr_red  = skills['rvr_red']
    sur_blue = skills['sur_blue']
    sur_red  = skills['sur_red']

    ssha_blue = skills['ssha_blue']
    ssha_red  = skills['ssha_red']
    sgha_blue = skills['sgha_blue']
    sgha_red  = skills['sgha_red']
    ssba_blue = skills['ssba_blue']
    ssba_red  = skills['ssba_red']
    sgba_blue = skills['sgba_blue']
    sgba_red  = skills['sgba_red']

    tda_blue = skills['tda_blue']
    tda_red  = skills['tda_red']
    sma_blue = skills['sma_blue']
    sma_red  = skills['sma_red']

    skd_blue = skills['skd_blue']
    skd_red  = skills['skd_red']
    sko_blue = skills['sko_blue']
    sko_red  = skills['sko_red']
    gko_blue = skills['gko_blue']
    gko_red  = skills['gko_red']

    sst_blue = skills['sst_blue']
    sst_red  = skills['sst_red']
    sgt_blue = skills['sgt_blue']
    sgt_red  = skills['sgt_red']

    weights = {
        1:  ssr_blue,
        2:  tdr_blue,
        3:  ssr_red,
        4:  tdr_red,
        5:  np.maximum(0, 1 - ssr_blue - tdr_blue - ssr_red - tdr_red),
        6:  sst_blue,
        7:  1 - sst_blue,
        8:  sst_red,
        9:  1 - sst_red,
        10: ssba_blue,
        11: 1 - ssba_blue,
        12: ssha_blue,
        13: 1 - ssha_blue,
        14: ssba_red,
        15: 1 - ssba_red,
        16: ssha_red,
        17: 1 - ssha_red,
        18: skd_blue,
        19: sko_blue,
        20: 1 - skd_blue - sko_blue,
        21: skd_red,
        22: sko_red,
        23: 1 - skd_red - sko_red,
        24: tda_blue,
        25: 1 - tda_blue,
        26: tda_red,
        27: 1 - tda_red,
        28: sgr_blue,
        29: smr_blue,
        30: rvr_red,
        31: sur_red,
        32: np.maximum(0, 1 - sgr_blue - smr_blue - rvr_red - sur_red),
        33: sgr_red,
        34: smr_red,
        35: rvr_blue,
        36: sur_blue,
        37: np.maximum(0, 1 - rvr_blue - sgr_red - smr_red - sur_blue),
        38: sgt_blue,
        39: 1 - sgt_blue,
        40: sgt_red,
        41: 1 - sgt_red,
        42: sgba_blue,
        43: 1 - sgba_blue,
        44: sgha_blue,
        45: 1 - sgha_blue,
        46: sgba_red,
        47: 1 - sgba_red,
        48: sgha_red,
        49: 1 - sgha_red,
        50: gko_blue,
        51: 1 - gko_blue,
        52: gko_red,
        53: 1 - gko_red,
        54: sma_blue,
        55: 1 - sma_blue,
        56: sma_red,
        57: 1 - sma_red,
        58: np.ones_like(ssr_blue),
        59: np.ones_like(ssr_blue),
        60: np.ones_like(ssr_blue),
        61: np.ones_like(ssr_blue),
        62: np.ones_like(ssr_blue),
        63: np.ones_like(ssr_blue),
        64: np.ones_like(ssr_blue),
        65: np.ones_like(ssr_blue),
        66: np.ones_like(ssr_blue),
        67: np.ones_like(ssr_blue),
        68: np.ones_like(ssr_blue),
        69: np.ones_like(ssr_blue),
        70: np.ones_like(ssr_blue),
        71: np.ones_like(ssr_blue),
        72: np.ones_like(ssr_blue),
        73: np.ones_like(ssr_blue),
    }
    return weights


def save_edges(fight_id: int, weights: Dict, model_id: int, **kwargs: Any) -> None:
    ts = kwargs.get('ts', int(datetime.now().timestamp()))

    edges = []

    for edge_id, weight in weights.items():
        edge = Edge(
            fight_id=fight_id,
            edge_id=edge_id,
            weight=weight.tobytes(),
            model_id=model_id,
            ts=ts
        ).to_dict()
        edges.append(edge)

    insert_edges(edges=edges)


def build_edges(fight_id: int, model_id: int, graph_id: int) -> List[Dict]:
    edges = []

    edge_ids = get_edge_ids(graph_id=graph_id)

    for edge_id in edge_ids:
        u, v   = get_u_and_v(edge_id=edge_id)
        weight = get_weight(
            fight_id=fight_id,
            edge_id=edge_id,
            model_id=model_id
        )

        edges.append({
            'u': u,
            'v': v,
            'weight': weight
        })

    return edges

