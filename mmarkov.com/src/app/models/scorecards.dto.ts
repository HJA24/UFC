import { ScorecardDto } from './scorecard.dto';

export interface ScorecardsDto {
  blue: { [points: number]: ScorecardDto[] };
  red: { [points: number]: ScorecardDto[] };
}
