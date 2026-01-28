export type Subscription =
  | 'STRAWWEIGHT'
  | 'LIGHTWEIGHT'
  | 'MIDDLEWEIGHT'
  | 'HEAVYWEIGHT';

export interface UserDto {
  userId: number;
  userName: string;
  userEmail: string;
  dateOfBirth: string;
  subscription: Subscription
}
