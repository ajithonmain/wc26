#!/usr/bin/env python3
"""
Enrich teams.json with FIFA codes + stadiums.json with capacity, using the
rezarahiminia/worldcup2026 reference data. Validates group assignments match.
Inputs: /tmp/their_teams.json, /tmp/stadiums.json (fetched from the repo).
Run after gen_teams.py / gen_fixtures.py.
"""
import json

their_teams = json.load(open("/tmp/their_teams.json"))
their_st = json.load(open("/tmp/stadiums.json"))

# fifa code by lowercased english name
fifa = {t["name_en"].lower(): t.get("fifa_code") for t in their_teams}
their_grp = {t["name_en"].lower(): t.get("groups") for t in their_teams}

# enrich teams.json
teams = json.load(open("src/data/teams.json"))
matched = mismatch = 0
for t in teams:
    if t["placeholder"]:
        continue
    key = t["name"].lower()
    if key in fifa and fifa[key]:
        t["fifaCode"] = fifa[key]
        matched += 1
    # validate group
    if key in their_grp and their_grp[key] and their_grp[key] != t["group"]:
        print(f"  GROUP MISMATCH: {t['name']} mine={t['group']} ref={their_grp[key]}")
        mismatch += 1
json.dump(teams, open("src/data/teams.json", "w"), indent=2, ensure_ascii=False)
print(f"FIFA codes added: {matched} | group mismatches: {mismatch}")

# build stadium capacity lookup -> stadiums.json
cap = {}
for s in their_st:
    cap[s["name_en"].lower()] = {
        "capacity": s.get("capacity"),
        "fifaName": s.get("fifa_name"),
        "country": s.get("country_en"),
    }
# write a stadiums reference file the app can use for venue chips
stadiums = [{
    "name": s["name_en"], "city": s.get("city_en"),
    "country": s.get("country_en"), "capacity": s.get("capacity"),
    "fifaName": s.get("fifa_name"),
} for s in their_st]
json.dump(stadiums, open("src/data/stadiums.json", "w"), indent=2, ensure_ascii=False)
print(f"Wrote stadiums.json: {len(stadiums)} venues")

# validate fixtures venues exist in stadium set
fx = json.load(open("src/data/fixtures.json"))
known = {s["name"].lower() for s in stadiums}
unknown = sorted({f["venue"] for f in fx if f["venue"] and f["venue"].lower() not in known})
if unknown:
    print("  venues not in ref set (ok if naming differs):", unknown)
else:
    print("All fixture venues validated against reference stadiums")
