from enum import Enum


class PropertyCategory(Enum):
    GRAPH = 0
    NODE  = 1


class GraphPropertyType(Enum):
    CLUSTERING    = "CLUSTERING"
    TRANSITIVITY  = "TRANSITIVITY"
    EFFICIENCY    = "EFFICIENCY"
    CONNECTIVITY  = "CONNECTIVITY"


class NodePropertyType(Enum):
    DEGREE_CENTRALITY = "DEGREE_CENTRALITY"
    CLUSTERING        = "CLUSTERING"
    CLOSENESS         = "CLOSENESS"
    EFFICIENCY        = "EFFICIENCY"