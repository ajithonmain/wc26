export type Confederation = "UEFA" | "CONMEBOL" | "CONCACAF" | "CAF" | "AFC" | "OFC";

const MAP: Record<string, Confederation> = {
  // UEFA (16)
  "Bosnia & Herzegovina": "UEFA", "Switzerland": "UEFA", "Scotland": "UEFA",
  "Türkiye": "UEFA", "Germany": "UEFA", "Netherlands": "UEFA", "Sweden": "UEFA",
  "Belgium": "UEFA", "Spain": "UEFA", "Norway": "UEFA", "France": "UEFA",
  "Austria": "UEFA", "Portugal": "UEFA", "England": "UEFA", "Croatia": "UEFA",
  "Czechia": "UEFA",
  // CONMEBOL (6)
  "Brazil": "CONMEBOL", "Argentina": "CONMEBOL", "Uruguay": "CONMEBOL",
  "Colombia": "CONMEBOL", "Ecuador": "CONMEBOL", "Paraguay": "CONMEBOL",
  // CONCACAF (6)
  "Mexico": "CONCACAF", "United States": "CONCACAF", "Canada": "CONCACAF",
  "Panama": "CONCACAF", "Curaçao": "CONCACAF", "Haiti": "CONCACAF",
  // CAF (9+1)
  "South Africa": "CAF", "Morocco": "CAF", "Ivory Coast": "CAF",
  "Tunisia": "CAF", "Egypt": "CAF", "Cape Verde": "CAF", "Senegal": "CAF",
  "Algeria": "CAF", "DR Congo": "CAF", "Ghana": "CAF",
  // AFC (8+1)
  "South Korea": "AFC", "Qatar": "AFC", "Saudi Arabia": "AFC", "Japan": "AFC",
  "Iran": "AFC", "Australia": "AFC", "Iraq": "AFC", "Jordan": "AFC",
  "Uzbekistan": "AFC",
  // OFC (1)
  "New Zealand": "OFC",
};

export function getConfederation(teamName: string): Confederation | null {
  return MAP[teamName] ?? null;
}
