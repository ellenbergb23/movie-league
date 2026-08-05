import { BO_TIERS } from "./constants";

export function revenueToBoxOfficeTier(revenue) {
  if (!revenue || revenue <= 0) return null;
  const millions = Math.round(revenue / 1000000);
  const billions = millions / 1000;
  const sortedTiers = [...BO_TIERS].sort((a, b) => {
    const aVal = parseTierValue(a.label);
    const bVal = parseTierValue(b.label);
    return bVal - aVal;
  });
  for (const tier of sortedTiers) {
    const tierValue = parseTierValue(tier.label);
    if (billions >= tierValue) {
      return tier.label;
    }
  }
  return null;
}

function parseTierValue(label) {
  const match = label.match(/[\d.]+/);
  if (!match) return 0;
  const value = parseFloat(match[0]);
  if (label.includes("bn")) return value;
  if (label.includes("m")) return value / 1000;
  return value;
}

export function isValidRevenue(revenue) {
  return revenue && typeof revenue === "number" && revenue > 0 && isFinite(revenue);
}
