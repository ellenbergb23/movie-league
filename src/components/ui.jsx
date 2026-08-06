export function SL({ children, t }) {
  return <p style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>{children}</p>;
}

// Collapsible section label — click to expand/collapse, shows a count badge next to the title.
export function CollapsibleSL({ children, count, open, onToggle, t }) {
  return (
    <button
      onClick={onToggle}
      style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, background: "none", border: "none", padding: 0, cursor: "pointer" }}
    >
      <span style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, letterSpacing: "0.1em", textTransform: "uppercase" }}>{children}</span>
      <span style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, background: t.surface2, border: `0.5px solid ${t.border}`, borderRadius: 10, padding: "1px 7px" }}>{count}</span>
      <span style={{ fontSize: 10, color: t.textMuted, transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>▶</span>
    </button>
  );
}
export function Card({ children, t, style = {} }) {
  return <div style={{ background: t.surface, border: `0.5px solid ${t.border}`, borderRadius: 10, padding: "14px 16px", ...style }}>{children}</div>;
}
export function OscarBadge({ noms, wins, t }) {
  if (!noms && !wins) return null;
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: t.goldBg, border: `0.5px solid ${t.gold}`, borderRadius: 4, padding: "2px 8px", fontSize: 11, color: t.gold, fontWeight: 600 }}>✦ {noms} nom{noms !== 1 ? "s" : ""}{wins > 0 ? ` · ${wins} win${wins !== 1 ? "s" : ""}` : ""}</span>;
}

export function Poster({ film, scoring, size = "small", t }) {
  const fs = scoring?.[film];
  const poster_path = fs?.poster_path;
  const poster_url = poster_path ? `https://image.tmdb.org/t/p/w200${poster_path}` : null;

  const sizes = { mini: { width: 26, height: 39 }, small: { width: 60, height: 90 }, large: { width: 100, height: 150 } };
  const dimensions = sizes[size] || sizes.small;

  if (poster_url) {
    return <img src={poster_url} alt={film} style={{ ...dimensions, borderRadius: 4, objectFit: "cover", flexShrink: 0 }} />;
  }
  return <div style={{ ...dimensions, background: "#000", borderRadius: 4, flexShrink: 0 }} />;
}
