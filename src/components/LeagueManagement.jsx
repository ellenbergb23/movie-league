import { useState, useEffect } from "react";
import { ConfirmDialog } from "./ui";
import { FONT_SERIF } from "../lib/constants";
import { cloneRules, rulesEqual, LEAGUE_MODES, applyLeagueMode, defaultScoringRules } from "../lib/scoringRules";

const DEFAULTS = defaultScoringRules();

// Collapsible section wrapper — long single-scroll page becomes accordion sections,
// which is especially helpful on mobile. `defaultOpen` keeps the most commonly-used
// section (League Mode) expanded on first load.
function Section({ title, defaultOpen = false, t, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 10, border: `0.5px solid ${t.border}`, borderRadius: 4, background: t.surface, overflow: "hidden" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <span style={{ fontFamily: FONT_SERIF, fontSize: 14, fontWeight: 600, color: t.text }}>{title}</span>
        <span style={{ fontSize: 11, color: t.textMuted, transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>▶</span>
      </button>
      {open && <div style={{ padding: "0 16px 16px" }}>{children}</div>}
    </div>
  );
}

function ResetButton({ onClick, t }) {
  return (
    <button onClick={onClick} style={{ fontSize: 11, color: t.textMuted, background: "none", border: `0.5px solid ${t.border}`, borderRadius: 4, cursor: "pointer", padding: "4px 10px", fontWeight: 600 }}>
      ↺ Reset to defaults
    </button>
  );
}

export function LeagueManagement({ rules, updateScoringRules, onDirtyChange, t, showToast, irConfig, updateIRConfig, movies, draftBoard, deleteMovie, leagueName, onDeleteLeague }) {
  const [draft, setDraft] = useState(() => cloneRules(rules));
  const [pendingMode, setPendingMode] = useState(null); // mode id awaiting confirm
  const [pendingReset, setPendingReset] = useState(null); // { label, path } | null
  const [filmFilter, setFilmFilter] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(null); // { film, owner } | null
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingLeague, setDeletingLeague] = useState(false);
  const [pendingDeleteLeague, setPendingDeleteLeague] = useState(false);

  // Finds which player currently has this film in a draft board slot, if any.
  function findDraftOwner(film) {
    for (const [player, picks] of Object.entries(draftBoard || {})) {
      if ((picks || []).includes(film)) return player;
    }
    return null;
  }
  function handleRemoveFilm(film) {
    setConfirmRemove({ film, owner: findDraftOwner(film) });
  }
  const filteredMovies = [...(movies || [])].sort((a, b) => a.localeCompare(b)).filter(f => f.toLowerCase().includes(filmFilter.trim().toLowerCase()));

  const dirty = !rulesEqual(draft, rules);
  useEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);

  function apply() {
    updateScoringRules(draft);
  }
  function cancel() {
    setDraft(cloneRules(rules));
    showToast("Changes discarded");
  }

  // Any manual edit while a preset mode is active silently switches the mode tag to
  // Custom (per product decision) — it does not touch any other values.
  function setField(path, value) {
    setDraft(d => {
      const next = cloneRules(d);
      let obj = next;
      for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]];
      obj[path[path.length - 1]] = value;
      if (next.mode !== "custom") next.mode = "custom";
      return next;
    });
  }

  function requestModeSwitch(modeId) {
    if (modeId === draft.mode) return;
    setPendingMode(modeId);
  }
  function confirmModeSwitch() {
    setDraft(d => applyLeagueMode(d, pendingMode));
    setPendingMode(null);
  }
  function cancelModeSwitch() { setPendingMode(null); }

  // Resets one or more fields of the draft back to shipped defaults (not the currently-saved
  // league rules), in case an accidental edit needs undoing without discarding everything else.
  function resetSection(paths) {
    setDraft(d => {
      const next = cloneRules(d);
      for (const path of paths) {
        let obj = next, defObj = DEFAULTS;
        for (let i = 0; i < path.length - 1; i++) { obj = obj[path[i]]; defObj = defObj[path[i]]; }
        obj[path[path.length - 1]] = JSON.parse(JSON.stringify(defObj[path[path.length - 1]]));
      }
      if (next.mode !== "custom") next.mode = "custom";
      return next;
    });
    setPendingReset(null);
  }

  async function handleDeleteLeague() {
    if (deleteConfirmText !== leagueName) return;
    setDeletingLeague(true);
    try {
      await onDeleteLeague();
    } catch (err) {
      setDeletingLeague(false);
      showToast(err.message || "Couldn't delete league");
    }
  }

  const inp = { fontSize: 13, padding: "6px 9px", borderRadius: 4, border: `0.5px solid ${t.borderStrong}`, background: t.surface2, color: t.text, width: "100%", boxSizing: "border-box" };
  const numInp = { ...inp, fontFamily: "monospace" };
  const rowStyle = { display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `0.5px solid ${t.border}` };
  const toggleLabel = { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: t.textSub, cursor: "pointer", whiteSpace: "nowrap" };
  const sectionHeadRow = { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 };

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
          <p style={{ fontFamily: FONT_SERIF, fontSize: 17, fontWeight: 600, color: t.text }}>League Management</p>
          <p style={{ fontSize: 12, color: t.textMuted }}>Custom scoring rules — commissioner only. Changes apply league-wide and recalculate scores immediately.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button onClick={cancel} disabled={!dirty} style={{ fontSize: 13, padding: "8px 16px", borderRadius: 4, border: `0.5px solid ${t.border}`, background: "transparent", color: dirty ? t.textSub : t.textMuted, cursor: dirty ? "pointer" : "default", fontWeight: 600, opacity: dirty ? 1 : 0.5 }}>Cancel</button>
          <button onClick={apply} disabled={!dirty} style={{ fontSize: 13, padding: "8px 16px", borderRadius: 4, border: "none", background: dirty ? t.gold : t.border, color: dirty ? "#fff" : t.textMuted, cursor: dirty ? "pointer" : "default", fontWeight: 600 }}>
            {dirty ? "Apply Changes" : "No Changes"}
          </button>
        </div>
      </div>

      {dirty && (
        <div style={{ background: t.goldBg, border: `0.5px solid ${t.gold}`, borderRadius: 4, padding: "8px 12px", marginBottom: 16, fontSize: 12, color: t.gold, fontWeight: 600 }}>
          Unsaved changes — click Apply Changes to save, or Cancel to discard.
        </div>
      )}

      {pendingMode && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: t.surface, border: `0.5px solid ${t.borderStrong}`, borderRadius: 4, padding: 20, maxWidth: 340 }}>
            <p style={{ fontFamily: FONT_SERIF, fontSize: 15, fontWeight: 600, color: t.text, marginBottom: 8 }}>Switch to {LEAGUE_MODES.find(m => m.id === pendingMode)?.label}?</p>
            <p style={{ fontSize: 12, color: t.textMuted, marginBottom: 16 }}>This overhauls which scoring categories are enabled for the league. You'll still need to click Apply Changes to save it.</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={cancelModeSwitch} style={{ fontSize: 13, padding: "7px 14px", borderRadius: 4, border: `0.5px solid ${t.border}`, background: "transparent", color: t.textSub, cursor: "pointer", fontWeight: 600 }}>Cancel</button>
              <button onClick={confirmModeSwitch} style={{ fontSize: 13, padding: "7px 14px", borderRadius: 4, border: "none", background: t.gold, color: "#fff", cursor: "pointer", fontWeight: 600 }}>Switch Mode</button>
            </div>
          </div>
        </div>
      )}

      {confirmRemove && (
        <ConfirmDialog
          t={t}
          title={`Remove "${confirmRemove.film}"?`}
          body={confirmRemove.owner
            ? `⚠️ Currently drafted by ${confirmRemove.owner}. Removing it will clear that pick from their board, and delete all its scoring data. This can't be undone.`
            : "This deletes the film and all its scoring data. This can't be undone."}
          confirmLabel="Remove film"
          onCancel={() => setConfirmRemove(null)}
          onConfirm={() => { deleteMovie(confirmRemove.film); setConfirmRemove(null); }}
        />
      )}

      <Section title={`Manage Films · ${(movies || []).length}`} t={t}>
        <p style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.5, marginBottom: 10 }}>
          Remove films you added by mistake or under the wrong title (e.g. old/misnamed entries). This deletes the film and its data entirely — it will no longer be checked by Fetch scoring.
        </p>
        <input
          value={filmFilter}
          onChange={e => setFilmFilter(e.target.value)}
          placeholder="Filter films…"
          style={{ ...inp, width: "100%", boxSizing: "border-box", marginBottom: 10 }}
        />
        <div style={{ maxHeight: 320, overflowY: "auto", border: `0.5px solid ${t.border}`, borderRadius: 8 }}>
          {filteredMovies.length === 0 && (
            <div style={{ padding: "12px 14px", fontSize: 12, color: t.textMuted }}>No films match.</div>
          )}
          {filteredMovies.map((f, i) => {
            const owner = findDraftOwner(f);
            return (
              <div key={f} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "9px 14px", borderBottom: i < filteredMovies.length - 1 ? `0.5px solid ${t.border}` : "none", background: i % 2 === 0 ? t.surface : t.rowAlt }}>
                <span style={{ fontSize: 13, color: t.text, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "left" }}>
                  {f}
                  {owner && <span style={{ fontSize: 10, color: t.gold, marginLeft: 8, fontWeight: 600 }}>· drafted by {owner}</span>}
                </span>
                <button
                  onClick={() => handleRemoveFilm(f)}
                  style={{ fontSize: 11, color: t.red, background: "none", border: `0.5px solid ${t.red}`, borderRadius: 6, cursor: "pointer", padding: "3px 8px", flexShrink: 0 }}
                >
                  remove
                </button>
              </div>
            );
          })}
        </div>
      </Section>

      {pendingReset && (
        <ConfirmDialog
          t={t}
          title={`Reset ${pendingReset.label} to defaults?`}
          body="This overwrites your current unsaved edits for this section only — everything else on this page is untouched. You'll still need to click Apply Changes to save it."
          confirmLabel="Reset section"
          onCancel={() => setPendingReset(null)}
          onConfirm={() => resetSection(pendingReset.paths)}
        />
      )}

      {/* League mode */}
      <Section title="League Mode" defaultOpen t={t}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {LEAGUE_MODES.map(m => {
            const active = draft.mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => requestModeSwitch(m.id)}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = t.gold; e.currentTarget.style.color = t.gold; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.color = t.textSub; } }}
                style={{
                  fontSize: 12, fontWeight: 600, padding: "7px 14px", borderRadius: 4, cursor: "pointer",
                  border: `0.5px solid ${active ? t.gold : t.border}`,
                  background: active ? t.goldBg : "transparent",
                  color: active ? t.gold : t.textSub,
                  transition: "border-color 0.15s, color 0.15s",
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>
        <p style={{ fontSize: 11, color: t.textMuted, marginTop: 10, marginBottom: 0 }}>
          Switching modes sets which scoring categories are on or off league-wide. Point values you've customized are kept.
        </p>
      </Section>

      {/* IR settings — saved immediately, independent of the Apply/Cancel scoring rules flow above */}
      <Section title="Injured Reserve" t={t}>
        <div style={rowStyle}>
          <Toggle checked={irConfig.enabled} onChange={checked => updateIRConfig({ ...irConfig, enabled: checked })} label="Enable IR" />
        </div>
        <div style={{ ...rowStyle, borderBottom: "none" }}>
          <span style={{ fontSize: 12, color: t.textSub, flex: 1 }}>IR slots per team</span>
          <select
            value={irConfig.maxSlots}
            disabled={!irConfig.enabled}
            onChange={e => updateIRConfig({ ...irConfig, maxSlots: Number(e.target.value) })}
            style={{ ...inp, width: 70, cursor: irConfig.enabled ? "pointer" : "default", opacity: irConfig.enabled ? 1 : 0.5 }}
          >
            {[1, 2, 3].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <p style={{ fontSize: 11, color: t.textMuted, marginTop: 10, marginBottom: 0 }}>
          Turns the IR feature on/off league-wide and sets how many films each team can place on IR at once (up to 3). Lowering this trims any team's IR list down to the new limit.
        </p>
      </Section>

      {/* Box office tiers */}
      <Section title="Box Office Tiers" t={t}>
        <div style={sectionHeadRow}>
          <Toggle checked={draft.boTiersEnabled} onChange={v => setField(["boTiersEnabled"], v)} label={draft.boTiersEnabled ? "Enabled" : "Disabled"} />
          <ResetButton t={t} onClick={() => setPendingReset({ label: "Box Office Tiers", paths: [["boTiers"]] })} />
        </div>
        {draft.boTiersEnabled && (
          <>
            <p style={{ fontSize: 12, color: t.textMuted, marginBottom: 10 }}>Points awarded at each revenue breakpoint (a film earns the highest tier it reaches).</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, fontSize: 11, color: t.textMuted, marginBottom: 4, fontWeight: 600 }}>
              <span>Breakpoint ($m)</span><span>Points</span><span></span>
            </div>
            {draft.boTiers.map((tier, i) => (
              <div key={i} style={rowStyle}>
                <input type="number" style={numInp} value={tier.millions} onChange={e => setField(["boTiers", i, "millions"], parseFloat(e.target.value) || 0)} />
                <input type="number" style={numInp} value={tier.pts} onChange={e => setField(["boTiers", i, "pts"], parseFloat(e.target.value) || 0)} />
                <button onClick={() => setDraft(d => { const next = cloneRules(d); next.boTiers.splice(i, 1); if (next.mode !== "custom") next.mode = "custom"; return next; })} style={{ fontSize: 11, color: t.red, background: "none", border: `0.5px solid ${t.red}`, borderRadius: 4, cursor: "pointer", padding: "4px 8px" }}>remove</button>
              </div>
            ))}
            <button onClick={() => setDraft(d => { const next = cloneRules(d); next.boTiers.push({ millions: 0, pts: 0 }); if (next.mode !== "custom") next.mode = "custom"; return next; })} style={{ marginTop: 10, fontSize: 12, color: t.gold, background: "none", border: `0.5px solid ${t.gold}`, borderRadius: 4, cursor: "pointer", padding: "5px 12px", fontWeight: 600 }}>+ Add tier</button>
          </>
        )}
      </Section>

      {/* Box office milestone bonuses */}
      <Section title="Box Office Milestone Bonuses" t={t}>
        <div style={sectionHeadRow}>
          <Toggle checked={draft.boBonuses.enabled} onChange={v => setField(["boBonuses", "enabled"], v)} label={draft.boBonuses.enabled ? "Enabled" : "Disabled"} />
          <ResetButton t={t} onClick={() => setPendingReset({ label: "Box Office Milestone Bonuses", paths: [["boBonuses"]] })} />
        </div>
        {draft.boBonuses.enabled && (
          <>
            {draft.boBonuses.milestones.map((m, i) => (
              <div key={i} style={rowStyle}>
                <input type="number" style={numInp} value={m.millions} onChange={e => setField(["boBonuses", "milestones", i, "millions"], parseFloat(e.target.value) || 0)} placeholder="$m" />
                <input type="number" style={numInp} value={m.pts} onChange={e => setField(["boBonuses", "milestones", i, "pts"], parseFloat(e.target.value) || 0)} placeholder="pts" />
                <button onClick={() => setDraft(d => { const next = cloneRules(d); next.boBonuses.milestones.splice(i, 1); if (next.mode !== "custom") next.mode = "custom"; return next; })} style={{ fontSize: 11, color: t.red, background: "none", border: `0.5px solid ${t.red}`, borderRadius: 4, cursor: "pointer", padding: "4px 8px" }}>remove</button>
              </div>
            ))}
            <button onClick={() => setDraft(d => { const next = cloneRules(d); next.boBonuses.milestones.push({ millions: 0, pts: 0 }); if (next.mode !== "custom") next.mode = "custom"; return next; })} style={{ marginTop: 10, fontSize: 12, color: t.gold, background: "none", border: `0.5px solid ${t.gold}`, borderRadius: 4, cursor: "pointer", padding: "5px 12px", fontWeight: 600 }}>+ Add milestone</button>
          </>
        )}
      </Section>

      {/* Opening weekend / weeks #1 */}
      <Section title="Season Bonuses" t={t}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
          <ResetButton t={t} onClick={() => setPendingReset({ label: "Season Bonuses", paths: [["openingWeekendBonus"], ["weeksNumber1Bonus"]] })} />
        </div>
        <div style={{ ...rowStyle, gridTemplateColumns: undefined }}>
          <span style={{ flex: 1, fontSize: 13, color: t.text }}>Biggest Opening Weekend</span>
          <Toggle checked={draft.openingWeekendBonus.enabled} onChange={v => setField(["openingWeekendBonus", "enabled"], v)} label="On" />
          {draft.openingWeekendBonus.enabled && (
            <input type="number" style={{ ...numInp, width: 70 }} value={draft.openingWeekendBonus.pts} onChange={e => setField(["openingWeekendBonus", "pts"], parseFloat(e.target.value) || 0)} />
          )}
        </div>
        <div style={{ ...rowStyle, borderBottom: "none" }}>
          <span style={{ flex: 1, fontSize: 13, color: t.text }}>Most Weeks at #1</span>
          <Toggle checked={draft.weeksNumber1Bonus.enabled} onChange={v => setField(["weeksNumber1Bonus", "enabled"], v)} label="On" />
          {draft.weeksNumber1Bonus.enabled && (
            <input type="number" style={{ ...numInp, width: 70 }} value={draft.weeksNumber1Bonus.pts} onChange={e => setField(["weeksNumber1Bonus", "pts"], parseFloat(e.target.value) || 0)} />
          )}
        </div>
      </Section>

      {/* Seen this film */}
      <Section title={'"Seen This Film"'} t={t}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
          <ResetButton t={t} onClick={() => setPendingReset({ label: "Seen This Film", paths: [["seenFilm"]] })} />
        </div>
        <div style={{ ...rowStyle, borderBottom: "none" }}>
          <span style={{ flex: 1, fontSize: 13, color: t.text }}>Point for marking a film as seen</span>
          <Toggle checked={draft.seenFilm.enabled} onChange={v => setField(["seenFilm", "enabled"], v)} label="On" />
          {draft.seenFilm.enabled && (
            <input type="number" style={{ ...numInp, width: 70 }} value={draft.seenFilm.pts} onChange={e => setField(["seenFilm", "pts"], parseFloat(e.target.value) || 0)} />
          )}
        </div>
      </Section>

      {/* Critics / Audience breakpoints */}
      <Section title="Critics & Audience Scores" t={t}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
          <ResetButton t={t} onClick={() => setPendingReset({ label: "Critics & Audience Scores", paths: [["critics"], ["audience"]] })} />
        </div>
        <p style={{ fontSize: 11, color: t.textMuted, marginBottom: 10 }}>Structure only — data source for these scores is being reworked separately.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {["critics", "audience"].map(kind => (
            <div key={kind}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: t.text, textTransform: "capitalize" }}>{kind}</span>
                <Toggle checked={draft[kind].enabled} onChange={v => setField([kind, "enabled"], v)} label="On" />
              </div>
              {draft[kind].enabled && (
                <>
                  {draft[kind].breakpoints.map((bp, i) => (
                    <div key={i} style={rowStyle}>
                      <input type="number" style={numInp} value={bp.min} onChange={e => setField([kind, "breakpoints", i, "min"], parseFloat(e.target.value) || 0)} placeholder="min %" />
                      <input type="number" style={numInp} value={bp.pts} onChange={e => setField([kind, "breakpoints", i, "pts"], parseFloat(e.target.value) || 0)} placeholder="pts" />
                      <button onClick={() => setDraft(d => { const next = cloneRules(d); next[kind].breakpoints.splice(i, 1); if (next.mode !== "custom") next.mode = "custom"; return next; })} style={{ fontSize: 11, color: t.red, background: "none", border: `0.5px solid ${t.red}`, borderRadius: 4, cursor: "pointer", padding: "4px 8px" }}>x</button>
                    </div>
                  ))}
                  <button onClick={() => setDraft(d => { const next = cloneRules(d); next[kind].breakpoints.push({ min: 0, pts: 0 }); if (next.mode !== "custom") next.mode = "custom"; return next; })} style={{ marginTop: 8, fontSize: 11, color: t.gold, background: "none", border: `0.5px solid ${t.gold}`, borderRadius: 4, cursor: "pointer", padding: "4px 10px", fontWeight: 600 }}>+ Add breakpoint</button>
                </>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Oscars */}
      <Section title="Oscars — Nomination vs. Win" t={t}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
          <ResetButton t={t} onClick={() => setPendingReset({ label: "Oscars", paths: [["oscarCategories"]] })} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 8, fontSize: 11, color: t.textMuted, marginBottom: 4, fontWeight: 600 }}>
          <span>Category</span><span>On</span><span>Nom pts</span><span>Win pts</span>
        </div>
        {draft.oscarCategories.map((cat, i) => (
          <div key={cat.name} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 8, alignItems: "center", padding: "6px 0", borderBottom: i < draft.oscarCategories.length - 1 ? `0.5px solid ${t.border}` : "none" }}>
            <span style={{ fontSize: 12, color: t.text }}>{cat.name}</span>
            <input type="checkbox" checked={cat.enabled !== false} onChange={e => setField(["oscarCategories", i, "enabled"], e.target.checked)} />
            {cat.enabled !== false ? (
              <>
                <input type="number" style={{ ...numInp, width: 60 }} value={cat.nomPts} onChange={e => setField(["oscarCategories", i, "nomPts"], parseFloat(e.target.value) || 0)} />
                <input type="number" style={{ ...numInp, width: 60 }} value={cat.winPts} onChange={e => setField(["oscarCategories", i, "winPts"], parseFloat(e.target.value) || 0)} />
              </>
            ) : (<><span /><span /></>)}
          </div>
        ))}
      </Section>

      <Section title="Danger Zone" t={t}>
        <p style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.5, marginBottom: 10 }}>
          Permanently deletes this league — all teams, draft picks, scores, and settings. This cannot be undone.
        </p>
        <button
          onClick={() => { setDeleteConfirmText(""); setPendingDeleteLeague(true); }}
          style={{ fontSize: 13, color: t.red, background: "none", border: `0.5px solid ${t.red}`, borderRadius: 4, cursor: "pointer", padding: "8px 16px", fontWeight: 600 }}
        >
          Delete League
        </button>
      </Section>

      {pendingDeleteLeague && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: t.surface, border: `0.5px solid ${t.borderStrong}`, borderRadius: 4, padding: 20, maxWidth: 380 }}>
            <p style={{ fontFamily: FONT_SERIF, fontSize: 15, fontWeight: 600, color: t.red, marginBottom: 8 }}>Delete "{leagueName}"?</p>
            <p style={{ fontSize: 12, color: t.textMuted, marginBottom: 12, lineHeight: 1.5 }}>
              This permanently removes the league and everything in it — teams, draft picks, scores, and settings — for everyone. This can't be undone.
            </p>
            <p style={{ fontSize: 12, color: t.textSub, marginBottom: 6 }}>
              Type <strong>{leagueName}</strong> to confirm:
            </p>
            <input
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              style={{ ...inp, marginBottom: 16 }}
              autoFocus
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setPendingDeleteLeague(false)} style={{ fontSize: 13, padding: "7px 14px", borderRadius: 4, border: `0.5px solid ${t.border}`, background: "transparent", color: t.textSub, cursor: "pointer", fontWeight: 600 }}>Cancel</button>
              <button
                onClick={handleDeleteLeague}
                disabled={deleteConfirmText !== leagueName || deletingLeague}
                style={{ fontSize: 13, padding: "7px 14px", borderRadius: 4, border: "none", background: t.red, color: "#fff", cursor: (deleteConfirmText === leagueName && !deletingLeague) ? "pointer" : "default", fontWeight: 600, opacity: (deleteConfirmText === leagueName && !deletingLeague) ? 1 : 0.5 }}
              >
                {deletingLeague ? "Deleting…" : "Delete League"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
