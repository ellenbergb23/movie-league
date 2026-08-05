export function WaitingPage({ t, user, onSignOut }) {
  return (
    <div style={{ minHeight: "100vh", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ width: 360, background: t.surface, border: `0.5px solid ${t.border}`, borderRadius: 16, padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: t.text, marginBottom: 8 }}>Waiting for team assignment</h2>
        <p style={{ fontSize: 13, color: t.textMuted, lineHeight: 1.6, marginBottom: 24 }}>You're signed in as <strong>{user.email}</strong>. The commissioner will assign you to your team shortly.</p>
        <button onClick={onSignOut} style={{ fontSize: 13, color: t.textMuted, background: "none", border: `0.5px solid ${t.border}`, borderRadius: 6, padding: "7px 16px", cursor: "pointer" }}>Sign out</button>
      </div>
    </div>
  );
}
