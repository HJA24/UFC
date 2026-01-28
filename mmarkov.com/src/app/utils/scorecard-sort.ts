import { ScorecardDto } from '../models/scorecard.dto';


export function sortScorecardsBlue(cards: ScorecardDto[]): ScorecardDto[] {
  return [...cards].sort((a, b) => a.numberOfPointsRed - b.numberOfPointsRed);
}

export function sortScorecardsRed(cards: ScorecardDto[]): ScorecardDto[] {
  return [...cards].sort((a, b) => a.numberOfPointsBlue - b.numberOfPointsBlue);
}
