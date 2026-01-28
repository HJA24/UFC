export type Period =
  | 'FIGHT'
  | 'ROUND';

export type Round = 1 | 2 | 3 | 4 | 5;

export type Category =
  | 'WINNER'
  | 'METHOD'
  | 'DURATION'
  | 'TOTALS'
  | 'STATS'
  | 'SUBMISSION'
  | 'COMEBACKS'
  | 'DECISIONS';


export type SubCategory =
  | 'KNOCKOUT'
  | 'SUBMISSION'
  | 'DECISION'
  | 'OVER_UNDER'
  | 'TOTALS'
  | 'DIFFERENTIAL'
  | 'PUNCH'
  | 'ELBOW'
  | 'KICK'
  | 'KNEE'
  | 'REAR_NAKED'
  | 'GUILLOTINE'
  | 'ARM_BAR'
  | 'ARM_TRIANGLE'
  | 'TRIANGLE'
  | 'DARCE'
  | 'UNANIMOUS'
  | 'SPLIT';


export type Stat =
  | 'STRIKES_LANDED'
  | 'TAKEDOWNS_LANDED'
  | 'SUBMISSION_ATTEMPTS'
  | 'GROUND_CONTROL';


export interface PredictionTypeDto {
  predictionTypeId: number;
  predictionTypeDescription: string;
  period: Period;
  round?: Round;
  category: Category;
  subCategory: SubCategory;
  stat?: Stat;
}
