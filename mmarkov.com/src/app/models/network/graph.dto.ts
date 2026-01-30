import { FighterDto } from "../fighter.dto";
import { Corner } from "../corner";
import { FightMatchupDto } from "../fight-matchup.dto";


export interface Coordinate {
  x: number;
  y: number;
  theta: number; // radians
}

export interface NodeDto {
  nodeId: number
  fighter: FighterDto
  pos: Coordinate
  color?: Corner | null
  cluster: number
}

export interface EdgeDto {
  source: number
  target: number
  weight: number
}

export interface GraphDto {
  data: FightMatchupDto[]
  nodes: NodeDto[]
  edges: EdgeDto[]
}
