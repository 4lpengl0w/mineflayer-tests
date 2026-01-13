from patchright.sync_api import sync_playwright
from datetime import datetime, timedelta, timezone
from argparse import ArgumentParser

parser = ArgumentParser(description="NameMC Scraper")

parser.add_argument("--mode", choices=["skins", "names"], default="names", help="Scrape skins or names")
parser.add_argument("--tag", default="", help="Tag for skins (e.g., 'trending', 'new'). Only used if mode is 'skins'")
parser.add_argument("--start", type=int, default=6, help="Starting page number")
parser.add_argument("--end", type=int, default=7, help="Ending page number")
parser.add_argument("--output", help="File to save usernames to (optional)")
parser.add_argument("--limit", type=int, default=0, help="Max number of items to scrape (0 for no limit)")

args = parser.parse_args()

PAGE_START = args.start
PAGE_END = args.end
LIMIT = args.limit
MODE = args.mode
TAG = args.tag if MODE == "skins" else ""
OUTPUT_FILE = args.output

if LIMIT: PAGE_END = 99999999

usernames = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()
    
    selector = 'div.card-header.text-center.text-nowrap.text-ellipsis.small-xs.normal-sm.p-1 span' if MODE == "skins" else 'td.text-left.text-nowrap.text-ellipsis a'

    rn = datetime.now(timezone.utc) - timedelta(hours=PAGE_START)
    offset = timedelta(hours=1)

    for page_int in range(PAGE_START, PAGE_END):
        if LIMIT > 0 and len(usernames) >= LIMIT: break
        timestr = None
        if not TAG:
            rn -= offset
            timestr = rn.strftime("%Y%m%dT%H%M%S") + "Z"

        page.goto(f"https://namemc.com/minecraft-{MODE}{f'/{TAG}' if TAG else ''}{f'?page={page_int}' if TAG else ''}{f'?time={timestr}&sort=asc' if timestr else ''}")
        print(f"went {page_int}")

        spans = page.locator(selector).all()
        for i, span in enumerate(spans):
            if LIMIT > 0 and len(usernames) >= LIMIT: break
            text = span.text_content()
            if text != "—": usernames.append(text)
    
    browser.close()

print("usernames: ")
for username in usernames: print(username)

NL = "\n"

if OUTPUT_FILE:
    with open(OUTPUT_FILE, "w") as file:
        for username in usernames: file.write(f"{username}{NL}")