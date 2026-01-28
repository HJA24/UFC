import pandas as pd
from dataclasses import dataclass
from database.domain import get_history, ufc_identifier_to_mrkv_identifier, ufc_identifiers_to_mrkv_identifiers
from typing import Dict, List, Optional, Union


def extract_opponents(df: Optional[pd.DataFrame]) -> List[int]:
    """
    Extracts unique opponent ids from the 'opponent' column.
    """
    if df is None or df.empty or 'opponent_id' not in df.columns:
        return []

    return [int(x) for x in df['opponent_id'].dropna().drop_duplicates().tolist()]


def get_fights(blue: int, red: int) -> Dict[str, pd.DataFrame]:
    """
    Gets fights of fighter blue, red and their opponents
    """
    blue_df = get_history(fighter_ids=[blue])
    red_df  = get_history(fighter_ids=[red])

    opponents_blue = extract_opponents(blue_df)
    opponents_red  = extract_opponents(red_df)

    opponents_blue_df = get_history(fighter_ids=opponents_blue)
    opponents_red_df  = get_history(fighter_ids=opponents_red)

    return {
        'blue': blue_df,
        'red':  red_df,
        'opponents_blue': opponents_blue_df,
        'opponents_red':  opponents_red_df
    }


@dataclass
class Matchups:
    fight_id:        int
    fighter_id_blue: int
    fighter_id_red:  int
    fights:          Union[pd.DataFrame, Dict[str, pd.DataFrame]]

    def __post_init__(self):
        fighters = self.get_fighters()

        self.fights = pd.concat(self.fights, ignore_index=True).drop_duplicates(subset=['ufc_id'])
        self.fights = self.fights[
            self.fights['fighter_id'].isin(fighters) &
            self.fights['opponent_id'].isin(fighters)
        ]

        # ufc to mrkv
        self.fights['fighter_id']  = self.fights['fighter_id'].apply(lambda x:  ufc_identifier_to_mrkv_identifier(table='fighters', ufc_id=x))
        self.fights['opponent_id'] = self.fights['opponent_id'].apply(lambda x: ufc_identifier_to_mrkv_identifier(table='fighters', ufc_id=x))

        self.fighters = ufc_identifiers_to_mrkv_identifiers(table='fighters', ufc_ids=fighters)
        self.fighter_id_blue = ufc_identifier_to_mrkv_identifier(table='fighters', ufc_id=self.fighter_id_blue)
        self.fighter_id_red  = ufc_identifier_to_mrkv_identifier(table='fighters', ufc_id=self.fighter_id_red)

    @classmethod
    def from_fighters(
            cls,
            fight_id:        int,
            fighter_id_blue: int,
            fighter_id_red:  int,
    ):
        fights = get_fights(blue=fighter_id_blue, red=fighter_id_red)

        return cls(
            fight_id=fight_id,
            fighter_id_blue=fighter_id_blue,
            fighter_id_red=fighter_id_red,
            fights=fights
        )

    def get_fighters(self) -> List[int]:
        opponents_blue = extract_opponents(self.fights['blue'])
        opponents_red  = extract_opponents(self.fights['red'])

        opponents_of_opponents_blue = extract_opponents(df=self.fights['opponents_blue'])
        opponents_of_opponents_red  = extract_opponents(df=self.fights['opponents_red'])

        common_opponents = set(opponents_blue) & set(opponents_red)
        common_opponents_of_opponents = set(opponents_of_opponents_blue) & set(opponents_of_opponents_red)

        other_fighter_ids = list((
            (common_opponents | common_opponents_of_opponents) - {self.fighter_id_blue, self.fighter_id_red}
        ))

        return list((
            [self.fighter_id_blue] + other_fighter_ids + [self.fighter_id_red]
        ))

    def to_list(self):
        df = self.fights.rename(columns={
            'ufc_id':      'fight_id',
            'fighter_id':  'fighter_id_blue',
            'opponent_id': 'fighter_id_red'
        })

        df['fight_id'] = self.fight_id

        COLUMNS = [
            'fight_id',
            'event_id',
            'fighter_id_blue',
            'fighter_id_red',
            'winner',
            'n_rounds',
            'n_seconds',
            'outcome'
        ]

        df = df[COLUMNS]

        return list(df.itertuples(index=False, name=None))
