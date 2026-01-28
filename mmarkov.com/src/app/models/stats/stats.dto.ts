import { HdisDto } from "../hdi/hdis.dto";


export enum Stats {
  NUMBER_OF_STRIKES_ATTEMPTED = "NUMBER_OF_STRIKES_ATTEMPTED",
  NUMBER_OF_STRIKES_LANDED = "NUMBER_OF_STRIKES_LANDED",
  NUMBER_OF_TAKEDOWNS_LANDED = "NUMBER_OF_TAKEDOWNS_LANDED",
  NUMBER_OF_SUBMISSIONS_ATTEMPTED = "NUMBER_OF_SUBMISSIONS_ATTEMPTED",
  TIME_SPENT_IN_CONTROL = "TIME_SPENT_IN_CONTROL"
}


export const StatsLabels:  Record<Stats, string> = {
  [Stats.NUMBER_OF_STRIKES_ATTEMPTED]: "number of strikes attempted",
  [Stats.NUMBER_OF_STRIKES_LANDED]: "number of strikes landed",
  [Stats.NUMBER_OF_TAKEDOWNS_LANDED]: "number of takedowns landed",
  [Stats.NUMBER_OF_SUBMISSIONS_ATTEMPTED]: "number of submissions attempted",
  [Stats.TIME_SPENT_IN_CONTROL]: "seconds in control"
}


export interface StatsPerFighterDto {
  blue: HdisDto;
  red: HdisDto;
}

export interface StatsDto {
  fightId: number;
  striking: Partial<Record<Stats, StatsPerFighterDto>>;
  grappling: Partial<Record<Stats, StatsPerFighterDto>>;
  control: Partial<Record<Stats, StatsPerFighterDto>>;
}

