import requests



TOKEN = 'eyJhbGciOiJSUzI1NiIsInB1ciI6IkFVVCIsInNpZyI6ImciLCJ0eXAiOiJKV1QiLCJ2IjozfQ.eyJhcCI6eyJhcHQiOiJJRCJ9LCJhcHIiOiJJRCIsImF1ZCI6WyJkY2UudWZjIl0sImRldiI6IkJST1dTRVIiLCJlbnQiOnsiYWFpIjpbNDgzNSwxNjldLCJnZWkiOlsxNjhdLCJpYWkiOlsxNTRdfSwiZW52IjoicHJvZCIsImV4cCI6MTc0MzcwODg1OSwiZ3VlIjpmYWxzZSwiaWF0IjoxNzQzNzA4MjU5LCJpcCI6Ijc3LjI0OC4xNS4yNCIsImlzcyI6ImRjZS1pZCIsImxvMiI6Ik5MLE5vcnRoIEhvbGxhbmQsTm9ydGggSG9sbGFuZCxBbXN0ZXJkYW0sMTA1NSwwLDAsMCIsInBhciI6MCwicHJvIjp7ImlkIjoiUDlnYUJQfDI4NTA4NDMzLTdkNTUtNGUyOC05NTNmLWI4Mzc3YjEyYmI3MyIsInRwIjoiYSJ9LCJyb2wiOiJDVVNUT01FUiIsInN1YiI6IlA5Z2FCUHwyODUwODQzMy03ZDU1LTRlMjgtOTUzZi1iODM3N2IxMmJiNzMiLCJ1dHAiOiJIVU1BTiJ9.VSyu_H0whXLE3oXENB0VZpUVHNlExYGU-fY9uYhzs9PM1zGqijdAvOri5EsEJnLem_lG-_iqbNBzmaTkNDoBEW_HklIdZFTZhJt1-lGFwbR9TkQ0leBgabNCbHh7zB1DbFm7mV4KCGTcEGOdSsOQ0DkxPke2w9BJ38jWYr0CzVM'

r = requests.get(url='https://dde-api.data.imgarena.com/mma/fightcards',
                 headers={
                     'Accept': 'application/vnd.imggaming.dde.api+json;version=1',
                     'Content-Type': 'application/json',
                     'Authorization': f'Bearer {TOKEN}'
                 })

if r.status_code == 200:
    a = 1