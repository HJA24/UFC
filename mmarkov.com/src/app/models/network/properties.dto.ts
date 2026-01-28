
export enum NodePropertyType {
  DEGREE_CENTRALITY = "DEGREE_CENTRALITY",
  CLUSTERING = "CLUSTERING",
  CLOSENESS = "CLOSENESS",
  EFFICIENY = "EFFICIENCY"
}


export enum GraphPropertyType {
  CLUSTERING = "CLUSTERING",
  TRANSITIVITY = "TRANSITIVITY",
  EFFICIENY = "EFFICIENCY",

  CONNECTIVITY = "CONNECTIVITY"
}

export const NodePropertyLabels: Record<NodePropertyType, string> = {
  [NodePropertyType.DEGREE_CENTRALITY]: "degree centrality",
  [NodePropertyType.CLUSTERING]:        "clustering",
  [NodePropertyType.CLOSENESS]:         "closeness",
  [NodePropertyType.EFFICIENY]:         "efficiency"
}


export const GraphPropertyLabels: Record<GraphPropertyType, string> = {
  [GraphPropertyType.CLUSTERING]:   "clustering",
  [GraphPropertyType.TRANSITIVITY]: "transitivity",
  [GraphPropertyType.EFFICIENY]:    "efficiency",
  [GraphPropertyType.CONNECTIVITY]: "connectivity"
}


export interface PropertiesDto {
  graph: Record<GraphPropertyType, number>
  nodes: Record<number, Record<NodePropertyType, number>>
}
