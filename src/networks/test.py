from matchups import Matchups
from network import Network
from database.domain import insert_matchups, insert_network


fight_id        = 2624
fighter_id_blue = 4119
fighter_id_red  = 2300

matchups = Matchups.from_fighters(
    fight_id=fight_id,
    fighter_id_blue=fighter_id_blue,
    fighter_id_red=fighter_id_red
)
insert_matchups(fight_id=fight_id, matchups=matchups.to_list())


# network = Network.from_matchups(matchups=matchups)
# insert_network(fight_id=fight_id, network=network.to_dict())