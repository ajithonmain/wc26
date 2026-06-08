"""
Scrape 2026 FIFA World Cup squads from Wikipedia.
Updates src/data/squads.json with full names, caps, intl goals, club.
Run: python3 scripts/scrapeWikiSquads.py
"""

import json, re, urllib.request

URL = "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_squads"

NAME_MAP = {
    "Bosnia and Herzegovina": "Bosnia & Herzegovina",
    "Ivory Coast": "Ivory Coast",
    "Côte d'Ivoire": "Ivory Coast",
    "Turkey": "Türkiye",
    "Türkiye": "Türkiye",
    "Czech Republic": "Czechia",
    "Congo DR": "DR Congo",
    "Democratic Republic of the Congo": "DR Congo",
    "Korea Republic": "South Korea",
    "United States": "United States",
}

POSITION_MAP = {"GK": "Goalkeeper", "DF": "Defender", "MF": "Midfielder", "FW": "Forward"}

SKIP_HEADINGS = {"Contents", "References", "External links", "See also", "Notes",
                 "Group A", "Group B", "Group C", "Group D", "Group E", "Group F",
                 "Group G", "Group H", "Group I", "Group J", "Group K", "Group L",
                 "Navigation menu", ""}

def clean(html):
    text = re.sub(r'<[^>]+>', '', html)
    text = re.sub(r'\[.*?\]', '', text)  # remove [refs]
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def parse_pos(raw):
    m = re.search(r'(GK|DF|MF|FW)', raw)
    return POSITION_MAP.get(m.group(1), raw.strip()) if m else raw.strip()

def parse_age(raw):
    m = re.search(r'aged (\d+)', raw)
    return int(m.group(1)) if m else None

def fetch():
    req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as r:
        return r.read().decode("utf-8")

def parse(html):
    squads = {}

    # Find all h3 headings and their positions
    headings = [(m.start(), m.end(), clean(m.group(1)))
                for m in re.finditer(r'<h3[^>]*>(.*?)</h3>', html, re.DOTALL)]

    for i, (h_start, h_end, raw_name) in enumerate(headings):
        if raw_name in SKIP_HEADINGS:
            continue

        team_name = NAME_MAP.get(raw_name, raw_name)

        # Section runs until the next heading
        section_end = headings[i + 1][0] if i + 1 < len(headings) else len(html)
        section = html[h_end:section_end]

        # Find wikitable in this section
        table_m = re.search(r'<table[^>]*wikitable[^>]*>(.*?)</table>', section, re.DOTALL)
        if not table_m:
            continue

        rows = re.findall(r'<tr[^>]*>(.*?)</tr>', table_m.group(1), re.DOTALL)
        players = []

        for row in rows:
            cells = re.findall(r'<t[dh][^>]*>(.*?)</t[dh]>', row, re.DOTALL)
            if len(cells) < 6:
                continue

            num_raw = clean(cells[0])
            if num_raw in ("No.", "No", "#", ""):
                continue  # header row

            try:
                number = int(re.search(r'\d+', num_raw).group())
            except:
                continue

            position  = parse_pos(clean(cells[1]))
            name      = clean(cells[2])
            age       = parse_age(cells[3])
            caps_raw  = clean(cells[4])
            goals_raw = clean(cells[5])
            club      = clean(cells[6]) if len(cells) > 6 else ""

            try:
                caps = int(re.search(r'\d+', caps_raw).group()) if re.search(r'\d+', caps_raw) else 0
            except:
                caps = 0
            try:
                intl_goals = int(re.search(r'\d+', goals_raw).group()) if re.search(r'\d+', goals_raw) else 0
            except:
                intl_goals = 0

            if name and position:
                players.append({
                    "name": name,
                    "number": number,
                    "position": position,
                    "age": age,
                    "caps": caps,
                    "intlGoals": intl_goals,
                    "club": club,
                })

        if players:
            squads[team_name] = players
            print(f"  {team_name}: {len(players)} players (sample: {players[0]['name']})")

    return squads

def main():
    print("Fetching Wikipedia WC2026 squads...")
    html = fetch()
    print(f"Page: {len(html):,} bytes\n")

    wiki = parse(html)
    print(f"\nParsed {len(wiki)} teams")

    with open("src/data/squads.json") as f:
        existing = json.load(f)

    merged = {}
    for team, wiki_players in wiki.items():
        api_players = existing.get(team, [])
        by_number = {p["number"]: p for p in api_players if p.get("number") is not None}
        final = []
        for wp in wiki_players:
            ap = by_number.get(wp["number"], {})
            final.append({
                "id":        ap.get("id"),
                "name":      wp["name"],
                "number":    wp["number"],
                "position":  wp["position"],
                "age":       wp["age"],
                "caps":      wp["caps"],
                "intlGoals": wp["intlGoals"],
                "club":      wp["club"],
                "photo":     ap.get("photo"),
            })
        merged[team] = final

    # Keep teams Wikipedia didn't cover
    missing = []
    for t, p in existing.items():
        if t not in merged:
            merged[t] = p
            missing.append(t)

    with open("src/data/squads.json", "w") as f:
        json.dump(merged, f, indent=2, ensure_ascii=False)

    total = sum(len(p) for p in merged.values())
    print(f"Saved: {len(merged)} teams, {total} players")
    if missing:
        print(f"Not in Wikipedia (kept existing): {', '.join(missing)}")

if __name__ == "__main__":
    main()
