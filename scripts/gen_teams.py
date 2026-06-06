#!/usr/bin/env python3
"""Generate teams.json — 48 teams, flagcdn ISO codes, group, FIFA rank, primary color (for adaptive glow)."""
import json

# name, iso2 (flagcdn), group, fifaRank, hex (national primary for glow)
TEAMS = [
    ("Mexico","mx","A",14,"#006847"), ("South Africa","za","A",66,"#007749"),
    ("South Korea","kr","A",23,"#C60C30"), ("Czechia","cz","A",43,"#11457E"),
    ("Canada","ca","B",30,"#FF0000"), ("Bosnia & Herzegovina","ba","B",74,"#002F6C"),
    ("Qatar","qa","B",36,"#8A1538"), ("Switzerland","ch","B",19,"#D52B1E"),
    ("Brazil","br","C",3,"#FFDF00"), ("Morocco","ma","C",12,"#C1272D"),
    ("Scotland","gb-sct","C",39,"#0065BF"), ("Haiti","ht","C",83,"#00209F"),
    ("United States","us","D",16,"#0A3161"), ("Paraguay","py","D",41,"#D52B1E"),
    ("Australia","au","D",26,"#00843D"), ("Türkiye","tr","D",27,"#E30A17"),
    ("Germany","de","E",9,"#FFCC00"), ("Curaçao","cw","E",90,"#002B7F"),
    ("Ivory Coast","ci","E",40,"#FF8200"), ("Ecuador","ec","E",24,"#FFD100"),
    ("Netherlands","nl","F",6,"#FF6200"), ("Japan","jp","F",18,"#BC002D"),
    ("Sweden","se","F",35,"#FECC02"), ("Tunisia","tn","F",49,"#E70013"),
    ("Belgium","be","G",8,"#FDDA24"), ("Egypt","eg","G",33,"#CE1126"),
    ("Iran","ir","G",21,"#239F40"), ("New Zealand","nz","G",86,"#00247D"),
    ("Spain","es","H",2,"#C60B1E"), ("Cape Verde","cv","H",73,"#003893"),
    ("Saudi Arabia","sa","H",58,"#006C35"), ("Uruguay","uy","H",15,"#7B9FD4"),
    ("France","fr","I",4,"#0055A4"), ("Senegal","sn","I",17,"#00853F"),
    ("Iraq","iq","I",58,"#CE1126"), ("Norway","no","I",32,"#BA0C2F"),
    ("Argentina","ar","J",1,"#75AADB"), ("Algeria","dz","J",37,"#006233"),
    ("Austria","at","J",22,"#ED2939"), ("Jordan","jo","J",64,"#007A3D"),
    ("Portugal","pt","K",5,"#FF0000"), ("DR Congo","cd","K",60,"#007FFF"),
    ("Uzbekistan","uz","K",57,"#1EB53A"), ("Colombia","co","K",13,"#FCD116"),
    ("England","gb-eng","L",7,"#CE1124"), ("Croatia","hr","L",10,"#FF0000"),
    ("Ghana","gh","L",75,"#006B3F"), ("Panama","pa","L",30,"#DA121A"),
]

teams = []
for name, iso, grp, rank, color in TEAMS:
    teams.append({
        "name": name,
        "iso": iso,
        "flag": f"https://flagcdn.com/w160/{iso}.png" if not iso.startswith("_") else None,
        "group": grp,
        "fifaRank": rank,
        "color": color,
        "placeholder": iso.startswith("_"),
    })

with open("src/data/teams.json", "w") as f:
    json.dump(teams, f, indent=2, ensure_ascii=False)
print(f"Wrote {len(teams)} teams")
