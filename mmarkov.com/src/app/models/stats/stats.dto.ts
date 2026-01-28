import { HdisDto } from "../hdi/hdis.dto";


export interface StatsPerFighterDto {
  blue: HdisDto;
  red: HdisDto;
}

export interface StatsDto {
  fightId: number;
  stats: {
    numberOfStrikesAttempted?: StatsPerFighterDto;
    numberOfStrikesLanded?: StatsPerFighterDto;
    numberOfSubmissionsAttempted?: StatsPerFighterDto;
    numberOfTakedownsLanded?: StatsPerFighterDto;
    timeSpentInControl?: StatsPerFighterDto;
  };
}
