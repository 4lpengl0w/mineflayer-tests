from patchright.sync_api import sync_playwright
from datetime import datetime, timedelta, timezone

PAGE_START = 6
PAGE_END = 7

MODE = "names" # skins, names
TAG = "" # "", trending, new

usernames = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()
    
    selector = 'div.card-header.text-center.text-nowrap.text-ellipsis.small-xs.normal-sm.p-1 span' if MODE == "skins" else 'td.text-left.text-nowrap.text-ellipsis a'

    rn = datetime.now(timezone.utc) - timedelta(hours=PAGE_START)
    offset = timedelta(hours=1)

    for page_int in range(PAGE_START, PAGE_END):
        if not TAG:
            rn -= offset
            timestr = rn.strftime("%Y%m%dT%H%M%S") + "Z"

        page.goto(f"https://namemc.com/minecraft-{MODE}{f'/{TAG}' if TAG else ''}{f'?page={page_int}' if TAG else ''}{f'?time={timestr}&sort=asc' if timestr else ''}")
        print(f"went {page_int}")

        spans = page.locator(selector).all()
        for i, span in enumerate(spans):
            text = span.text_content()
            if text != "—": usernames.append(text)
    
    browser.close()

print("usernames: ")
for username in usernames: print(username)