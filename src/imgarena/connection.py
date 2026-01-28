IMGARENA_ENDPOINT = 'btec-websocket.services.imgarena.com'
WS_ENDPOINT = f'wss://{IMGARENA_ENDPOINT}'


HTTP_HEADERS = {
    'host': 'btec-http.services.imgarena.com',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.5414.120 Safari/537.36',
    'operator': 'bet365',
    'sport': 'UFC',
    'content-type': 'application/json',
    'accept': '*/*',
    'origin': 'https://bet365.apps.imgarena.com/',
    'sec-fetch-site': 'same-site',
    'sec-fetch-mode': 'cors',
    'sec-fetch-dest': 'empty',
    'referer': 'https://bet365.apps.imgarena.com/',
    'accept-encoding': 'gzip, deflate',
    'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8'
}

WS_HEADER = {
    'accept-encoding': 'gzip, deflate, br',
    'accept-language': 'en-US,en;q=0.9',
    'connection': 'upgrade',
    'pragma': 'no-cache',
    'cache-control': 'no-cache',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    'upgrade': 'websocket',
    'origin': 'https://bet365.apps.imgarena.com',
    'sec-webSocket-protocol': 'graphql-ws'
}