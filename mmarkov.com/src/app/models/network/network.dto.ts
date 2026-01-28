import { PropertiesDto } from "./properties.dto";
import { GraphDto } from "./graph.dto";

export interface NetworkDto {
    fightId: number;
    graph: GraphDto;
    properties: PropertiesDto;
}
