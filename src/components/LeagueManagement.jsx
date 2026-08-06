import { useState, useEffect } from "react";
import { SL, Card } from "./ui";
import { cloneRules, rulesEqual } from "../lib/scoringRules";

export function LeagueManagement({ rules, updateScoringRules, onDirtyChange, t, showToast }) {
  const [draft, setDraft] = useState(() => cloneRules(rules));

  const dirty = !rulesEqual(draft, rules);
  useEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);

  function apply() {
    updateScoringRules(draft);
  }
  function cancel() {
    setDraft(cloneRules(rules));
    showToast("Changes discarded");
  }

  function setField(path, value) {
    setDraft(d => {
      const next = cloneRules(d);
      let obj = next;
      for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]];
      obj[path[path.length - 1]] = value;
      return next;
    });
  }

  const inp = { fontSize: 13, padding: "6px 9px", borderRadius: 7, border: `0.5px solid ${t.borderStrong}`, background: t.surface2, color: t.text, width: "100%", boxSizing: "border-box" };
  const numInp = { ...inp, fontFamily: "monospace" };
  const rowStyle = { display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `0.5px solid ${t.border}` };
  const toggleLabel = { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: t.textSub, cursor: "pointer", whiteSpace: "nowrap" };

  function Toggle({ checked, onChange, label }) {
    return (
      <label style={toggleLabel}>
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
        {label}
      </label>
    );
  }

  return (
    <div>
      <div style={{ position: "sticky", top: 0, zIndex: 5, background: t.bg, paddingBottom: 10, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: t.text }}>League Management</p>
          <p style={{ fontSize: 12, color: t.textMuted }}>Custom scoring rules — commissioner only. Changes apply league-wide and recalculate scores immediately.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button onClick={cancel} disabled={!dirty} style={{ fontSize: 13, padding: "8px 16px", borderRadius: 8, border: `0.5px solid ${t.border}`, background: "transparent", color: dirty ? t.textSub : t.textMuted, cursor: dirty ? "pointer" : "default", fontWeight: 600, opacity: dirty ? 1 : 0.5 }}>Cancel</button>
          <button onClick={apply} disabled={!dirty} style={{ fontSize: 13, padding: "8px 16px", borderRadius: 8, border: "none", background: dirty ? t.gold : t.border, color: dirty ? "#fff" : t.textMuted, cursor: dirty ? "pointer" : "default", fontWeight: 600 }}>
            {dirty ? "Apply Changes" : "No Changes"}
          </button>
        </div>
      </div>

      {dirty && (
        <div style={{ background: t.goldBg, border: `0.5px solid ${t.gold}`, borderRadius: 8, padding: "8px 12px", marginBottom: 16, fontSize: 12, color: t.gold, fontWeight: 600 }}>
          Unsaved changes — click Apply Changes to save, or Cancel to discard.
        </div>
      )}

      {/* Box office tiers */}
      <SL t={t}>box office tiers</SL>
      <Card t={t} style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 12, color: t.textMuted, marginBottom: 10 }}>Points awarded at each revenue breakpoint (a film earns the highest tier it reaches).</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, fontSize: 11, color: t.textMuted, marginBottom: 4, fontWeight: 600 }}>
          <span>Breakpoint ($m)</span><span>Points</span><span></span>
        </div>
        {draft.boTiers.map((tier, i) => (
          <div key={i} style={rowStyle}>
            <input type="number" style={numInp} value={tier.millions} onChange={e => setField(["boTiers", i, "millions"], parseFloat(e.target.value) || 0)} />
            <input type="number" style={numInp} value={tier.pts} onChange={e => setField(["boTiers", i, "pts"], parseFloat(e.target.value) || 0)} />
            <button onClick={() => setDraft(d => { const next = cloneRules(d); next.boTiers.splice(i, 1); return next; })} style={{ fontSize: 11, color: t.red, background: "none", border: `0.5px solid ${t.red}`, borderRadius: 6, cursor: "pointer", padding: "4px 8px" }}>remove</button>
          </div>
        ))}
        <button onClick={() => setDraft(d => { const next = cloneRules(d); next.boTiers.push({ millions: 0, pts: 0 }); return next; })} style={{ marginTop: 10, fontSize: 12, color: t.gold, background: "none", border: `0.5px solid ${t.gold}`, borderRadius: 6, cursor: "pointer", padding: "5px 12px", fontWeight: 600 }}>+ Add tier</button>
      </Card>

      {/* Box office milestone bonuses */}
      <SL t={t}>box office milestone bonuses</SL>
      <Card t={t} style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 10 }}>
          <Toggle checked={draft.boBonuses.enabled} onChange={v => setField(["boBonuses", "enabled"], v)} label={draft.boBonuses.enabled ? "Enabled" : "Disabled"} />
        </div>
        {draft.boBonuses.milestones.map((m, i) => (
          <div key={i} style={rowStyle}>
            <input type="number" style={numInp} value={m.millions} onChange={e => setField(["boBonuses", "milestones", i, "millions"], parseFloat(e.target.value) || 0)} placeholder="$m" />
            <input type="number" style={numInp} value={m.pts} onChange={e => setField(["boBonuses", "milestones", i, "pts"], parseFloat(e.target.value) || 0)} placeholder="pts" />
            <button onClick={() => setDraft(d => { const next = cloneRules(d); next.boBonuses.milestones.splice(i, 1); return next; })} style={{ fontSize: 11, color: t.red, background: "none", border: `0.5px solid ${t.red}`, borderRadius: 6, cursor: "pointer", padding: "4px 8px" }}>remove</button>
          </div>
        ))}
        <button onClick={() => setDraft(d => { const next = cloneRules(d); next.boBonuses.milestones.push({ millions: 0, pts: 0 }); return next; })} style={{ marginTop: 10, fontSize: 12, color: t.gold, background: "none", border: `0.5px solid ${t.gold}`, borderRadius: 6, cursor: "pointer", padding: "5px 12px", fontWeight: 600 }}>+ Add milestone</button>
      </Card>

      {/* Opening weekend / weeks #1 */}
      <SL t={t}>season bonuses</SL>
      <Card t={t} style={{ marginBottom: 20 }}>
        <div style={{ ...rowStyle, gridTemplateColumns: undefined }}>
          <span style={{ flex: 1, fontSize: 13, color: t.text }}>Biggest Opening Weekend</span>
          <Toggle checked={draft.openingWeekendBonus.enabled} onChange={v => setField(["openingWeekendBonus", "enabled"], v)} label="On" />
          <input type="number" style={{ ...numInp, width: 70 }} value={draft.openingWeekendBonus.pts} onChange={e => setField(["openingWeekendBonus", "pts"], parseFloat(e.target.value) || 0)} />
        </div>
        <div style={{ ...rowStyle, borderBottom: "none" }}>
          <span style={{ flex: 1, fontSize: 13, color: t.text }}>Most Weeks at #1</span>
          <Toggle checked={draft.weeksNumber1Bonus.enabled} onChange={v => setField(["weeksNumber1Bonus", "enabled"], v)} label="On" />
          <input type="number" style={{ ...numInp, width: 70 }} value={draft.weeksNumber1Bonus.pts} onChange={e => setField(["weeksNumber1Bonus", "pts"], parseFloat(e.target.value) || 0)} />
        </div>
      </Card>

      {/* Seen this film */}
      <SL t={t}>"seen this film"</SL>
      <Card t={t} style={{ marginBottom: 20 }}>
        <div style={{ ...rowStyle, borderBottom: "none" }}>
          <span style={{ flex: 1, fontSize: 13, color: t.text }}>Point for marking a film as seen</span>
          <Toggle checked={draft.seenFilm.enabled} onChange={v => setField(["seenFilm", "enabled"], v)} label="On" />
          <input type="number" style={{ ...numInp, width: 70 }} value={draft.seenFilm.pts} onChange={e => setField(["seenFilm", "pts"], parseFloat(e.target.value) || 0)} />
        </div>
      </Card>

      {/* Critics / Audience breakpoints */}
      <SL t={t}>critics & audience scores</SL>
      <Card t={t} style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, color: t.textMuted, marginBottom: 10 }}>Structure only — data source for these scores is being reworked separately.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {["critics", "audience"].map(kind => (
            <div key={kind}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: t.text, textTransform: "capitalize" }}>{kind}</span>
                <Toggle checked={draft[kind].enabled} onChange={v => setField([kind, "enabled"], v)} label="On" />
              </div>
              {draft[kind].breakpoints.map((bp, i) => (
                <div key={i} style={rowStyle}>
                  <input type="number" style={numInp} value={bp.min} onChange={e => setField([kind, "breakpoints", i, "min"], parseFloat(e.target.value) || 0)} placeholder="min %" />
                  <input type="number" style={numInp} value={bp.pts} onChange={e => setField([kind, "breakpoints", i, "pts"], parseFloat(e.target.value) || 0)} placeholder="pts" />
                  <button onClick={() => setDraft(d => { const next = cloneRules(d); next[kind].breakpoints.splice(i, 1); return next; })} style={{ fontSize: 11, color: t.red, background: "none", border: `0.5px solid ${t.red}`, borderRadius: 6, cursor: "pointer", padding: "4px 8px" }}>x</button>
                </div>
              ))}
              <button onClick={() => setDraft(d => { const next = cloneRules(d); next[kind].breakpoints.push({ min: 0, pts: 0 }); return next; })} style={{ marginTop: 8, fontSize: 11, color: t.gold, background: "none", border: `0.5px solid ${t.gold}`, borderRadius: 6, cursor: "pointer", padding: "4px 10px", fontWeight: 600 }}>+ Add breakpoint</button>
            </div>
          ))}
        </div>
      </Card>

      {/* Oscars */}
      <SL t={t}>oscars — nomination vs. win</SL>
      <Card t={t}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 8, fontSize: 11, color: t.textMuted, marginBottom: 4, fontWeight: 600 }}>
          <span>Category</span><span>On</span><span>Nom pts</span><span>Win pts</span>
        </div>
        {draft.oscarCategories.map((cat, i) => (
          <div key={cat.name} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 8, alignItems: "center", padding: "6px 0", borderBottom: i < draft.oscarCategories.length - 1 ? `0.5px solid ${t.border}` : "none" }}>
            <span style={{ fontSize: 12, color: t.text }}>{cat.name}</span>
            <input type="checkbox" checked={cat.enabled !== false} onChange={e => setField(["oscarCategories", i, "enabled"], e.target.checked)} />
            <input type="number" style={{ ...numInp, width: 60 }} value={cat.nomPts} onChange={e => setField(["oscarCategories", i, "nomPts"], parseFloat(e.target.value) || 0)} />
            <input type="number" style={{ ...numInp, width: 60 }} value={cat.winPts} onChange={e => setField(["oscarCategories", i, "winPts"], parseFloat(e.target.value) || 0)} />
          </div>
        ))}
      </Card>
    </div>
  );
}
