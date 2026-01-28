import { FighterDto } from "./fighter.dto"
import { EventDto } from "./event.dto"


export interface FightMatchupDto {
  fighterBlue: FighterDto
  fighterRed: FighterDto
  winner: string | null
  outcome: string
  numberOfRounds: number
  numberOfSeconds: number
  event: EventDto
}
