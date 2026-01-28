import { HDIDto } from './hdi.dto';
import { Corner} from "./corner";


export interface ScorecardDto {
  scorecardId: number;
  judgeId: number;
  fightId: number;

  winner: Corner;
  numberOfPointsBlue: number;
  numberOfPointsRed: number;
  
  hdis: { [probability: string]: HDIDto };
}
