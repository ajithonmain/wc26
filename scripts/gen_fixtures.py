#!/usr/bin/env python3
"""
Generate the complete 104-match fixtures.json — fool-proof, no API key needed.
- Group stage: 72 matches, confirmed teams + ET kickoffs from published FIFA schedule.
- Knockout: 32 matches with placeholder slots ('Winner Group A', '3rd C/D/F...') + confirmed dates/venues.
ET (EDT summer) = UTC-4. Output is ISO UTC; client renders IST via Intl.
Run: python3 scripts/gen_fixtures.py
"""
import json
from datetime import datetime, timedelta, timezone

ET = timezone(timedelta(hours=-4))
mid = 0

def utc(m, d, hhmm):
    h, mn = map(int, hhmm.split(":"))
    return datetime(2026, m, d, h, mn, tzinfo=ET).astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S+00:00")

PH = ("Winner","Runner","3rd","W ","L ","UEFA","Intercont")
def fx(m, d, t, home, away, rnd, venue, city, grp=None):
    global mid; mid += 1
    hs, as_ = home["slot"], away["slot"]
    return {
        "id": 9000 + mid,
        "kickoffUTC": utc(m, d, t),
        "venue": venue, "city": city,
        "round": rnd, "group": grp,
        "status": "NS",
        "home": home, "away": away,
        "score": {"home": None, "away": None},
        "placeholder": hs.startswith(PH) or as_.startswith(PH),
    }

# ---------- GROUP STAGE (72) ----------
# (month, day, ET time, home, away, group, venue, city)
GS = [
 (6,11,"15:00","Mexico","South Africa","A","Estadio Azteca","Mexico City"),
 (6,11,"22:00","South Korea","Czechia","A","Estadio Akron","Guadalajara"),
 (6,12,"15:00","Canada","Bosnia & Herzegovina","B","BMO Field","Toronto"),
 (6,12,"21:00","United States","Paraguay","D","SoFi Stadium","Los Angeles"),
 (6,13,"12:00","Qatar","Switzerland","B","Levi's Stadium","San Francisco"),
 (6,13,"15:00","Brazil","Morocco","C","MetLife Stadium","New York"),
 (6,13,"18:00","Australia","Türkiye","D","Lumen Field","Seattle"),
 (6,13,"21:00","Scotland","Haiti","C","Gillette Stadium","Boston"),
 (6,14,"13:00","Germany","Curaçao","E","NRG Stadium","Houston"),
 (6,14,"16:00","Ivory Coast","Ecuador","E","Lincoln Financial Field","Philadelphia"),
 (6,14,"19:00","Netherlands","Japan","F","AT&T Stadium","Dallas"),
 (6,14,"22:00","Sweden","Tunisia","F","Estadio BBVA","Monterrey"),
 (6,15,"12:00","Spain","Cape Verde","H","Mercedes-Benz Stadium","Atlanta"),
 (6,15,"15:00","Belgium","Egypt","G","Lumen Field","Seattle"),
 (6,15,"18:00","Saudi Arabia","Uruguay","H","Hard Rock Stadium","Miami"),
 (6,15,"21:00","Iran","New Zealand","G","SoFi Stadium","Los Angeles"),
 (6,16,"15:00","France","Senegal","I","MetLife Stadium","New York"),
 (6,16,"18:00","Iraq","Norway","I","Gillette Stadium","Boston"),
 (6,16,"21:00","Argentina","Algeria","J","Arrowhead Stadium","Kansas City"),
 (6,16,"00:00","Austria","Jordan","J","Levi's Stadium","San Francisco"),
 (6,17,"13:00","Portugal","DR Congo","K","NRG Stadium","Houston"),
 (6,17,"16:00","England","Croatia","L","AT&T Stadium","Dallas"),
 (6,17,"19:00","Ghana","Panama","L","BMO Field","Toronto"),
 (6,17,"22:00","Uzbekistan","Colombia","K","Estadio Azteca","Mexico City"),
 # Matchday 2
 (6,18,"12:00","South Africa","South Korea","A","Mercedes-Benz Stadium","Atlanta"),
 (6,18,"15:00","Mexico","Czechia","A","Estadio Azteca","Mexico City"),
 (6,18,"18:00","Switzerland","Canada","B","Lumen Field","Seattle"),
 (6,18,"21:00","Bosnia & Herzegovina","Qatar","B","Levi's Stadium","San Francisco"),
 (6,19,"12:00","Morocco","Scotland","C","Gillette Stadium","Boston"),
 (6,19,"15:00","Brazil","Haiti","C","Lincoln Financial Field","Philadelphia"),
 (6,19,"18:00","United States","Australia","D","Lumen Field","Seattle"),
 (6,19,"21:00","Paraguay","Türkiye","D","SoFi Stadium","Los Angeles"),
 (6,20,"12:00","Ecuador","Germany","E","NRG Stadium","Houston"),
 (6,20,"15:00","Curaçao","Ivory Coast","E","Arrowhead Stadium","Kansas City"),
 (6,20,"18:00","Japan","Sweden","F","AT&T Stadium","Dallas"),
 (6,20,"21:00","Netherlands","Tunisia","F","Estadio BBVA","Monterrey"),
 (6,21,"12:00","Egypt","Iran","G","MetLife Stadium","New York"),
 (6,21,"15:00","Belgium","New Zealand","G","Gillette Stadium","Boston"),
 (6,21,"18:00","Uruguay","Spain","H","Hard Rock Stadium","Miami"),
 (6,21,"21:00","Cape Verde","Saudi Arabia","H","Mercedes-Benz Stadium","Atlanta"),
 (6,22,"12:00","Senegal","France","I","MetLife Stadium","New York"),
 (6,22,"15:00","Norway","Iraq","I","Lincoln Financial Field","Philadelphia"),
 (6,22,"18:00","Algeria","Argentina","J","Arrowhead Stadium","Kansas City"),
 (6,22,"21:00","Jordan","Austria","J","SoFi Stadium","Los Angeles"),
 (6,23,"13:00","Portugal","Uzbekistan","K","NRG Stadium","Houston"),
 (6,23,"16:00","England","Ghana","L","Gillette Stadium","Boston"),
 (6,23,"19:00","Panama","Croatia","L","BMO Field","Toronto"),
 (6,23,"22:00","Colombia","DR Congo","K","Estadio Akron","Guadalajara"),
 # Matchday 3 (synchronized pairs)
 (6,24,"18:00","Czechia","South Africa","A","Estadio Akron","Guadalajara"),
 (6,24,"18:00","South Korea","Mexico","A","Estadio Azteca","Mexico City"),
 (6,24,"14:00","Qatar","Canada","B","BMO Field","Toronto"),
 (6,24,"14:00","Switzerland","Bosnia & Herzegovina","B","Levi's Stadium","San Francisco"),
 (6,25,"18:00","Haiti","Morocco","C","Gillette Stadium","Boston"),
 (6,25,"18:00","Scotland","Brazil","C","Lincoln Financial Field","Philadelphia"),
 (6,25,"21:00","Türkiye","United States","D","SoFi Stadium","Los Angeles"),
 (6,25,"21:00","Australia","Paraguay","D","Lumen Field","Seattle"),
 (6,26,"14:00","Curaçao","Ecuador","E","Arrowhead Stadium","Kansas City"),
 (6,26,"14:00","Germany","Ivory Coast","E","NRG Stadium","Houston"),
 (6,26,"18:00","Tunisia","Netherlands","F","Estadio BBVA","Monterrey"),
 (6,26,"18:00","Japan","Sweden","F","AT&T Stadium","Dallas"),
 (6,26,"21:00","New Zealand","Belgium","G","SoFi Stadium","Los Angeles"),
 (6,26,"21:00","Iran","Egypt","G","Levi's Stadium","San Francisco"),
 (6,27,"14:00","Saudi Arabia","Cape Verde","H","Hard Rock Stadium","Miami"),
 (6,27,"14:00","Uruguay","Spain","H","Mercedes-Benz Stadium","Atlanta"),
 (6,27,"18:00","Norway","Senegal","I","Gillette Stadium","Boston"),
 (6,27,"18:00","Iraq","France","I","MetLife Stadium","New York"),
 (6,27,"21:00","Jordan","Argentina","J","Arrowhead Stadium","Kansas City"),
 (6,27,"21:00","Algeria","Austria","J","SoFi Stadium","Los Angeles"),
 (6,27,"19:30","Colombia","Portugal","K","Hard Rock Stadium","Miami"),
 (6,27,"19:30","DR Congo","Uzbekistan","K","Mercedes-Benz Stadium","Atlanta"),
 (6,27,"17:00","England","Panama","L","MetLife Stadium","New York"),
 (6,27,"17:00","Croatia","Ghana","L","Estadio Akron","Guadalajara"),
]
fixtures = [fx(m,d,t,{"name":h,"slot":h},{"name":a,"slot":a},f"Group Stage - Matchday",v,c,g) for (m,d,t,h,a,g,v,c) in GS]

# ---------- KNOCKOUT (32) ----------
def ko(m,d,t,home,away,rnd,venue,city):
    return fx(m,d,t,{"name":home,"slot":home},{"name":away,"slot":away},rnd,venue,city)

# Round of 32 (Jun 28 - Jul 3) — slots are descriptive placeholders
R32 = [
 (6,28,"15:00","Runner-up A","Runner-up B","Round of 32","SoFi Stadium","Los Angeles"),
 (6,29,"13:00","Winner C","Runner-up F","Round of 32","NRG Stadium","Houston"),
 (6,29,"16:30","Winner E","3rd A/B/C/D/F","Round of 32","Gillette Stadium","Boston"),
 (6,29,"21:00","Winner F","Runner-up C","Round of 32","Estadio BBVA","Monterrey"),
 (6,30,"13:00","Runner-up E","Runner-up I","Round of 32","AT&T Stadium","Dallas"),
 (6,30,"17:00","Winner I","3rd C/D/F/G/H","Round of 32","MetLife Stadium","New York"),
 (6,30,"21:00","Winner A","3rd C/E/F/H/I","Round of 32","Estadio Azteca","Mexico City"),
 (7,1,"12:00","Winner L","3rd E/H/I/J/K","Round of 32","Mercedes-Benz Stadium","Atlanta"),
 (7,1,"16:00","Winner G","3rd A/E/H/I/J","Round of 32","Lumen Field","Seattle"),
 (7,1,"20:00","Winner D","3rd B/E/F/I/J","Round of 32","Levi's Stadium","San Francisco"),
 (7,2,"13:00","Runner-up K","Runner-up L","Round of 32","Arrowhead Stadium","Kansas City"),
 (7,2,"17:00","Winner H","Runner-up J","Round of 32","Hard Rock Stadium","Miami"),
 (7,2,"21:00","Winner B","3rd E/F/G/I/J","Round of 32","BMO Field","Toronto"),
 (7,3,"13:00","Winner K","Runner-up H","Round of 32","Lincoln Financial Field","Philadelphia"),
 (7,3,"17:00","Winner J","Runner-up D","Round of 32","SoFi Stadium","Los Angeles"),
 (7,3,"21:00","Runner-up G","3rd A/B/C/D/E","Round of 32","Estadio Akron","Guadalajara"),
]
fixtures += [ko(*r) for r in R32]

R16 = [
 (7,4,"15:00","W R32-1","W R32-2","Round of 16","Lincoln Financial Field","Philadelphia"),
 (7,4,"19:00","W R32-3","W R32-4","Round of 16","NRG Stadium","Houston"),
 (7,5,"15:00","W R32-5","W R32-6","Round of 16","MetLife Stadium","New York"),
 (7,5,"19:00","W R32-7","W R32-8","Round of 16","Estadio Azteca","Mexico City"),
 (7,6,"15:00","W R32-9","W R32-10","Round of 16","AT&T Stadium","Dallas"),
 (7,6,"19:00","W R32-11","W R32-12","Round of 16","Mercedes-Benz Stadium","Atlanta"),
 (7,7,"15:00","W R32-13","W R32-14","Round of 16","Hard Rock Stadium","Miami"),
 (7,7,"19:00","W R32-15","W R32-16","Round of 16","Levi's Stadium","San Francisco"),
]
fixtures += [ko(*r) for r in R16]

QF = [
 (7,9,"17:00","W R16-1","W R16-2","Quarter-final","Gillette Stadium","Boston"),
 (7,10,"17:00","W R16-3","W R16-4","Quarter-final","SoFi Stadium","Los Angeles"),
 (7,11,"17:00","W R16-5","W R16-6","Quarter-final","Hard Rock Stadium","Miami"),
 (7,11,"21:00","W R16-7","W R16-8","Quarter-final","Arrowhead Stadium","Kansas City"),
]
fixtures += [ko(*r) for r in QF]

SF = [
 (7,14,"15:00","W QF-1","W QF-2","Semi-final","AT&T Stadium","Dallas"),
 (7,15,"15:00","W QF-3","W QF-4","Semi-final","Mercedes-Benz Stadium","Atlanta"),
]
fixtures += [ko(*r) for r in SF]
fixtures += [ko(7,18,"17:00","Loser SF-1","Loser SF-2","Third-place Play-off","Hard Rock Stadium","Miami")]
fixtures += [ko(7,19,"15:00","Winner SF-1","Winner SF-2","Final","MetLife Stadium","New York")]

fixtures.sort(key=lambda f: f["kickoffUTC"])
with open("src/data/fixtures.json", "w") as f:
    json.dump(fixtures, f, indent=2, ensure_ascii=False)

# verify
rounds = {}
for fxr in fixtures:
    r = fxr["round"]
    rounds[r] = rounds.get(r,0)+1
print(f"Total: {len(fixtures)} matches")
for r,n in rounds.items(): print(f"  {r}: {n}")
