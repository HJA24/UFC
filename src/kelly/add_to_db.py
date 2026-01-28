import json
from scripts.database.database import insert_market

PATH = '/Users/huibmeulenbelt/PycharmProjects/ufc/scripts/kelly/markets.json'
markets = json.load(open(PATH))

for _, market in markets.items():

    del market['fighter']
    del market['period']
    del market['round']
    del market['minute']
    del market['seconds']
    del market['stat']
    del market['n']
    del market['relationship']
    insert_market(market)