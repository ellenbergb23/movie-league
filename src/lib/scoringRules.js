import { OSCAR_CATEGORIES } from "./constants";

// Clean, consistent progression: +2 pts per $100m breakpoint, no baked-in bonuses.
// Milestone bonuses (below) are a separate, additive layer on top of this.
const DEFAULT_BO_TIERS = Array.from({ length: 30 }, (_, i) => ({
  millions: (i + 1) * 100,
  pts: (i + 1) * 2,
}));

export const LEAGUE_MODES = [
  { id: "classic", label: "Classic" },
  { id: "boxOfficeOnly", label: "Box Office Only" },
  { id: "oscars", label: "Oscars Mode" },
  { id: "custom", label: "Custom" },
];

export function defaultScoringRules() {
  return {
    mode: "classic",
    boTiersEnabled: true,
    boTiers: DEFAULT_BO_TIERS.map(t => ({ ...t })),
    boBonuses: {
      enabled: true,
      milestones: Array.from({ length: 6 }, (_, i) => ({
        millions: (i + 1) * 500,
        pts: 2,
      })),
    },
    openingWeekendBonus: { enabled: true, pts: 1 },
    weeksNumber1Bonus: { enabled: true, pts: 1 },
    seenFilm: { enabled: true, pts: 1 },
    critics: {
      enabled: true,
      breakpoints: [
        { min: 90, pts: 7 },
        { min: 60, pts: 2 },
        { min: 0, pts: 0 },
      ],
    },
    audience: {
      enabled: true,
      breakpoints: [
        { min: 90, pts: 5 },
        { min: 0, pts: 0 },
      ],
    },
    oscarCategories: OSCAR_CATEGORIES.map(c => ({ ...c, enabled: true })),
  };
}

export const DEFAULT_SCORING_RULES = defaultScoringRules();

export function cloneRules(rules) { return JSON.parse(JSON.stringify(rules)); }
export function rulesEqual(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

// Merges saved rules with defaults so older saved shapes / new fields never crash the UI.
export function normalizeRules(saved) {
  const d = defaultScoringRules();
  if (!saved) return d;
  return {
    mode: saved.mode || d.mode,
    boTiersEnabled: saved.boTiersEnabled ?? d.boTiersEnabled,
    boTiers: Array.isArray(saved.boTiers) && saved.boTiers.length ? saved.boTiers : d.boTiers,
    boBonuses: { ...d.boBonuses, ...(saved.boBonuses || {}) },
    openingWeekendBonus: { ...d.openingWeekendBonus, ...(saved.openingWeekendBonus || {}) },
    weeksNumber1Bonus: { ...d.weeksNumber1Bonus, ...(saved.weeksNumber1Bonus || {}) },
    seenFilm: { ...d.seenFilm, ...(saved.seenFilm || {}) },
    critics: {
      enabled: saved.critics?.enabled ?? d.critics.enabled,
      breakpoints: Array.isArray(saved.critics?.breakpoints) && saved.critics.breakpoints.length ? saved.critics.breakpoints : d.critics.breakpoints,
    },
    audience: {
      enabled: saved.audience?.enabled ?? d.audience.enabled,
      breakpoints: Array.isArray(saved.audience?.breakpoints) && saved.audience.breakpoints.length ? saved.audience.breakpoints : d.audience.breakpoints,
    },
    oscarCategories: Array.isArray(saved.oscarCategories) && saved.oscarCategories.length === d.oscarCategories.length
      ? saved.oscarCategories
      : d.oscarCategories,
  };
}

// Applies a mode preset to an existing rules draft, toggling section on/off flags only —
// existing point values/breakpoints are left untouched so a commissioner's custom numbers
// survive a mode switch. "custom" just tags the draft as custom without changing any flags.
export function applyLeagueMode(rules, modeId) {
  const next = cloneRules(rules);
  next.mode = modeId;
  if (modeId === "custom") return next;

  const allOscarsOn = modeId === "oscars";
  next.oscarCategories = next.oscarCategories.map(c => ({ ...c, enabled: allOscarsOn }));

  if (modeId === "classic") {
    next.boTiersEnabled = true;
    next.boBonuses.enabled = true;
    next.openingWeekendBonus.enabled = true;
    next.weeksNumber1Bonus.enabled = true;
    next.seenFilm.enabled = true;
    next.critics.enabled = true;
    next.audience.enabled = true;
  } else if (modeId === "boxOfficeOnly") {
    next.boTiersEnabled = true;
    next.boBonuses.enabled = true;
    next.openingWeekendBonus.enabled = true;
    next.weeksNumber1Bonus.enabled = true;
    next.seenFilm.enabled = true;
    next.critics.enabled = false;
    next.audience.enabled = false;
  } else if (modeId === "oscars") {
    next.boTiersEnabled = false;
    next.boBonuses.enabled = false;
    next.openingWeekendBonus.enabled = false;
    next.weeksNumber1Bonus.enabled = false;
    next.seenFilm.enabled = true;
    next.critics.enabled = false;
    next.audience.enabled = false;
  }
  return next;
}

export function formatBOLabel(millions) {
  if (millions >= 1000) {
    const bn = millions / 1000;
    return `$${bn % 1 === 0 ? bn.toFixed(0) : bn.toFixed(1)}bn`;
  }
  return `$${millions}m`;
}

// Given a list of {millions, pts} breakpoints (any order) and a revenue in millions,
// returns the highest tier reached, e.g. { label, pts, millions }.
export function resolveBOTier(revenueMillions, boTiers) {
  if (revenueMillions == null || isNaN(revenueMillions)) return null;
  const sorted = [...(boTiers || [])].sort((a, b) => b.millions - a.millions);
  const tier = sorted.find(t => revenueMillions >= t.millions);
  if (!tier) return null;
  return { label: formatBOLabel(tier.millions), pts: tier.pts, millions: tier.millions };
}

export function getBOTierPointsByLabel(label, boTiers) {
  if (!label) return 0;
  const tier = (boTiers || []).find(t => formatBOLabel(t.millions) === label);
  return tier?.pts || 0;
}

export function getBOBonusPoints(revenueMillions, boBonuses) {
  if (!boBonuses?.enabled || revenueMillions == null) return 0;
  return (boBonuses.milestones || []).reduce((sum, m) => sum + (revenueMillions >= m.millions ? m.pts : 0), 0);
}

function breakpointPoints(score, breakpointRule) {
  if (!breakpointRule?.enabled || score == null) return 0;
  const sorted = [...(breakpointRule.breakpoints || [])].sort((a, b) => b.min - a.min);
  const hit = sorted.find(bp => score >= bp.min);
  return hit?.pts || 0;
}
export function getCriticsPoints(score, rules) { return breakpointPoints(score, rules.critics); }
export function getAudiencePoints(score, rules) { return breakpointPoints(score, rules.audience); }
