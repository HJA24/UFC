import os
import json
import logging
import requests
import boto3
from uuid import uuid4
from urllib.parse import quote_plus

import selenium.webdriver.chrome.webdriver
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from database.domain import update_image_url_of_fighter

from typing import Optional


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s.%(msecs)03d: %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


PATH_IMAGES = '/Users/huibmeulenbelt/PycharmProjects/ufc/data/fighters'


HEADERS = {
    'User-Agent': (
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
        'AppleWebKit/537.36 (KHTML, like Gecko)'
        'Chrome/120.0.0.0 Safari/537.36'
    )
}


BUCKET = 'mmarkov-assets-media'
CDN    = 'https://cdn.mmarkov.com'
s3 = boto3.client("s3")


def parse_data_eventoptions(attr: str):
    if not attr:
        return {}
    try:
        return json.loads(attr)
    except json.JSONDecodeError:
        try:
            return json.loads(attr.replace("'", '"'))
        except json.JSONDecodeError:
            return {}


def create_driver(headless: bool = True):
    options = webdriver.ChromeOptions()
    if headless:
        options.add_argument('--headless=new')
    options.add_argument('--disable-gpu')
    options.add_argument('--no-sandbox')
    options.add_argument('--window-size=1920,1080')

    return webdriver.Chrome(options=options)


def find_image_url(
        driver: selenium.webdriver.chrome.webdriver.WebDriver,
        url: str,
        fighter_id: int
) -> Optional[str]:
    driver.get(url)

    wait = WebDriverWait(driver, 10)

    try:
        elements = wait.until(
            EC.presence_of_all_elements_located(
                (
                    By.XPATH,
                    "//*[@class='HitchhikerProductProminentImageClickable-link']"
                )
            )
        )

    except TimeoutException:
        return None

    for element in elements:
        data_event = element.get_attribute('data-eventoptions')
        data_dict = parse_data_eventoptions(data_event)

        if str(data_dict.get('entityId')) != str(fighter_id):
            continue

        try:
            img_el = element.find_element(
                By.XPATH,
                './/img[contains(@class, "HitchhikerProductProminentImage-img")]'
            )
        except NoSuchElementException:
            continue

        img_url = img_el.get_attribute('src') or img_el.get_attribute('data-src')

        if img_url:
            return img_url

    return None


def get_image_url(fighter_id: int, fighter_name: str) -> Optional[str]:
    driver = create_driver(headless=True)

    try:
        query = quote_plus(fighter_name)

        search_url = f'https://answers-embed-client.ufc.com.pagescdn.com/?query={query}&referrerPageUrl=https://www.ufc.com/'
        image_url  = find_image_url(driver, search_url, fighter_id)

        return image_url

    finally:
        driver.quit()


def process_image_url(image_url: str) -> Optional[str]:
    if 'UFC-Male-Fallback-Image.jpg' in image_url:
        return None

    elif '.jpg' in image_url:
        return None

    if image_url.startswith('//'):
        image_url = 'https:' + image_url
    elif image_url.startswith('/'):
        image_url = 'https://www.ufc.com' + image_url

    return image_url


def download_image(url: str, file_name: str) -> None:
    file_path = os.path.join(PATH_IMAGES, file_name)

    resp = requests.get(url, headers=HEADERS, timeout=20)
    resp.raise_for_status()

    with open(file_path, 'wb') as f:
        f.write(resp.content)


def load_image(fighter_id: int) -> bytes:
    path = os.path.join(PATH_IMAGES, f'{fighter_id}.png')

    with open(path, 'rb') as f:
        return f.read()


def upload_image(fighter_id: int) -> str:
    image = load_image(fighter_id=fighter_id)
    image_id = uuid4().hex
    key = f'fighters/{image_id}.png'

    s3.put_object(
        Bucket=BUCKET,
        Key=key,
        Body=image,
        ContentType='image/png',
        CacheControl='public, max-age=31536000, immutable',
    )

    return f'{CDN}/{key}'


def process_image(fighter_id: int, fighter_name: str) -> Optional[str]:
    image_url = get_image_url(fighter_id=fighter_id, fighter_name=fighter_name)

    if image_url is None:
        return None

    image_url = process_image_url(image_url=image_url)

    if image_url is None:
        return None

    file_name = f'{fighter_id}.png'

    download_image(url=image_url, file_name=file_name)
    cdn_url = upload_image(fighter_id=fighter_id)

    return cdn_url


def get_missing_images_of_fighters() -> None:
    fighters = os.listdir(PATH_IMAGES)

    for fighter in fighters:
        try:
            fighter_id = int(fighter.split('.')[0])
        except Exception as e:
            logger.error(f'something went wrong for {fighter} - {e}')
            continue

        url = upload_image(fighter_id)
        update_image_url_of_fighter(fighter_id=fighter_id, url=url)
        logger.info(f'added image url to fighter {fighter_id}')