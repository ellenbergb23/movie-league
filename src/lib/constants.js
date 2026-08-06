export const DEFAULT_PLAYERS = ["Ryan Williams","Illike","Walker","Nook","Ben Hillman","Chrinny","Ben E","IRobis"];
export const ROUNDS = ["1","2","3","4","5","6","7","S1","S2"];
export const YEARS  = ["2023","2024","2025","2026"];
export const PLAYER_COLORS = ["#4A90D9","#A855F7","#22C55E","#F97316","#94A3B8","#EC4899","#EF4444","#14B8A6"];
export const GOLD = "#C9A84C";

// Default IR configuration — matches pre-existing hardcoded behavior (IR on, 1 slot).
export const DEFAULT_IR_CONFIG = { enabled: true, maxSlots: 1 };

export const OSCAR_CATEGORIES = [
  { name: "Best Picture", nomPts: 10, winPts: 10 },
  { name: "Best Director", nomPts: 3, winPts: 5 },
  { name: "Best Actor in a Leading Role", nomPts: 3, winPts: 5 },
  { name: "Best Actress in a Leading Role", nomPts: 3, winPts: 5 },
  { name: "Best Adapted Screenplay", nomPts: 3, winPts: 5 },
  { name: "Best Original Screenplay", nomPts: 3, winPts: 5 },
  { name: "Best Cinematography", nomPts: 3, winPts: 5 },
  { name: "Best Film Editing", nomPts: 3, winPts: 5 },
  { name: "Best Actor in a Supporting Role", nomPts: 1, winPts: 2 },
  { name: "Best Actress in a Supporting Role", nomPts: 1, winPts: 2 },
  { name: "Best Production Design", nomPts: 1, winPts: 2 },
  { name: "Best Costume Design", nomPts: 1, winPts: 2 },
  { name: "Best Animated Feature", nomPts: 1, winPts: 2 },
  { name: "Best Makeup", nomPts: 1, winPts: 2 },
  { name: "Best Original Score", nomPts: 1, winPts: 2 },
  { name: "Best International Feature", nomPts: 1, winPts: 2 },
  { name: "Best Original Song", nomPts: 1, winPts: 2 },
  { name: "Best Casting", nomPts: 1, winPts: 1 },
  { name: "Best Sound", nomPts: 1, winPts: 2 },
  { name: "Best Visual Effects", nomPts: 1, winPts: 2 },
];

export const BO_TIERS = [
  { label: "$3bn+",  pts: 74 }, { label: "$2.9bn", pts: 68 },
  { label: "$2.8bn", pts: 64 }, { label: "$2.7bn", pts: 60 },
  { label: "$2.6bn", pts: 56 }, { label: "$2.5bn", pts: 54 },
  { label: "$2.4bn", pts: 50 }, { label: "$2.3bn", pts: 48 },
  { label: "$2.2bn", pts: 46 }, { label: "$2.1bn", pts: 44 },
  { label: "$2bn",   pts: 44 }, { label: "$1.9bn", pts: 40 },
  { label: "$1.8bn", pts: 38 }, { label: "$1.7bn", pts: 37 },
  { label: "$1.6bn", pts: 36 }, { label: "$1.5bn", pts: 36 },
  { label: "$1.4bn", pts: 32 }, { label: "$1.3bn", pts: 30 },
  { label: "$1.2bn", pts: 28 }, { label: "$1.1bn", pts: 26 },
  { label: "$1bn",   pts: 24 }, { label: "$900m",  pts: 20 },
  { label: "$800m",  pts: 18 }, { label: "$700m",  pts: 16 },
  { label: "$600m",  pts: 14 }, { label: "$500m",  pts: 12 },
  { label: "$400m",  pts:  8 }, { label: "$300m",  pts:  6 },
  { label: "$200m",  pts:  4 }, { label: "$100m",  pts:  2 },
  { label: "Under $100m", pts: 0 },
];

export const RT_OPTIONS     = ["", "90%+ (7pts)", "Fresh 60-89% (2pts)", "Rotten (0pts)"];
export const RT_AUD_OPTIONS = ["", "90%+ (5pts)", "Below 90% (0pts)"];

export const HISTORICAL = {
  "Ryan Williams": { "2023": 37,  "2024": 97,  "2025": 104 },
  "Illike":        { "2023": 48,  "2024": 77,  "2025": 106 },
  "Walker":        { "2023": 0,   "2024": 0,   "2025": 61  },
  "Nook":          { "2023": 74,  "2024": 134, "2025": 79  },
  "Ben Hillman":   { "2023": 35,  "2024": 111, "2025": 103 },
  "Chrinny":       { "2023": 0,   "2024": 0,   "2025": 144 },
  "Ben E":         { "2023": 23,  "2024": 58,  "2025": 136 },
  "IRobis":        { "2023": 0,   "2024": 0,   "2025": 113 },
};

export const THEMES = {
  light: {
    bg: "#F7F5F0", surface: "#FFFFFF", surface2: "#F0EDE6",
    border: "#D4CFC4", borderStrong: "#B8B0A0",
    text: "#1A1714", textSub: "#4A4540", textMuted: "#8C8078",
    header: "#FFFFFF", navActive: "#1A1714", navInactive: "#8C8078",
    gold: GOLD, goldBg: "#FBF5E6", selectBg: "#F0EDE6", rowAlt: "#FAF8F5",
    red: "#B71C1C", redBg: "#FFEBEE",
  },
  dark: {
    bg: "#0A0A0A", surface: "#141414", surface2: "#1E1E1E",
    border: "#2A2A2A", borderStrong: "#3A3A3A",
    text: "#F0EDE8", textSub: "#A8A29E", textMuted: "#6B6560",
    header: "#0F0F0F", navActive: GOLD, navInactive: "#6B6560",
    gold: GOLD, goldBg: "#1E1A0E", selectBg: "#1E1E1E", rowAlt: "#161616",
    red: "#EF5350", redBg: "#1A0A0A",
  },
};
