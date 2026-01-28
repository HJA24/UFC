import type  { FighterDto } from "./fighter.dto";

export type Weightclass =
  | 'STRAWWEIGHT'
  | 'FLYWEIGHT'
  | 'BANTAMWEIGHT'
  | 'FEATHERWEIGHT'
  | 'LIGHTWEIGHT'
  | 'WELTERWEIGHT'
  | 'MIDDLEWEIGHT'
  | 'LIGHT_HEAVYWEIGHT'
  | 'HEAVYWEIGHT';


export type FightCard =
  | 'MAIN'
  | 'PRELIM'
  | 'EARLY_PRELIM';

export interface FightDto {
  fightId: number;
  fighterBlue: FighterDto;
  fighterRed: FighterDto;
  numberOfRounds: number;
  weightClass: Weightclass;
}
