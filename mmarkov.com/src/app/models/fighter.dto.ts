export type Gender =
  | 'MALE'
  | 'FEMALE';

export interface FighterDto {
  fighterId: number;
  firstName: string;
  lastName: string;
  imageURL?: string | null;
  gender: Gender;
}
