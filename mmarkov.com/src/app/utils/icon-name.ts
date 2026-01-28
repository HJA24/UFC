export function iconNameFromFightDetails(
  outcome: string,
  winner: string | null
): string {

  const corner =
    winner == 'BLUE' ? 'Blue':
    winner == 'RED' ? 'Red':
    ''

  return outcome.toLowerCase() + corner
}
