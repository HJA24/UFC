import { SCORECARD_CONFIG } from '../config/scorecards.config';

export function generateRangeNumberOfPoints(numberOfRounds: number): number[] {
  const minNumberOfPoints = SCORECARD_CONFIG.MIN_POINTS_PER_ROUND * numberOfRounds;
  const maxNumberOfPoints = SCORECARD_CONFIG.MAX_POINTS_PER_ROUND * numberOfRounds;

  return Array.from({ length: maxNumberOfPoints - minNumberOfPoints + 1 }, (_, i) => minNumberOfPoints + i);

}
