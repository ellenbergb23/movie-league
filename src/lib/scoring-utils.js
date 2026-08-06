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
  if (label.startsWith("Under")) return 0;
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

export function formatRevenue(revenue) {
  if (!revenue) return "—";
  if (revenue >= 1_000_000_000) return `$${(revenue / 1_000_000_000).toFixed(2)}bn`;
  if (revenue >= 1_000_000) return `$${(revenue / 1_000_000).toFixed(1)}m`;
  return `$${revenue.toLocaleString()}`;
}
