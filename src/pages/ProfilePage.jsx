import React, { useState } from "react";
import { glassStyle, DISPLAY_FONT, BODY_FONT } from "../styles/theme";
import { Sheen } from "../components/Primitives";

const inputStyle = (C) => ({
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  borderRadius: 10,
  border: `1px solid ${C.glassBorder}`,
  background: "transparent",
  color: C.text,
  fontFamily: BODY_FONT,
  fontSize: 14,
  outline: "none",
  marginBottom: 14,
});

export default function ProfilePage({ C, user, onUpdateUser }) {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    onUpdateUser({ name, email });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      <h1 style={{ fontFamily: DISPLAY_FONT, fontWeight: 800, fontSize: 22, color: C.text, margin: "0 0 18px 0" }}>Profile</h1>
      <form onSubmit={handleSave} style={{ ...glassStyle(C, { padding: 22, borderRadius: 18 }) }}>
        <Sheen C={C} />
        <div style={{ position: "relative" }}>
          <label style={{ fontFamily: BODY_FONT, fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle(C)} />
          <label style={{ fontFamily: BODY_FONT, fontSize: 12, color: C.muted, display: "block", marginBottom: 6 }}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle(C)} />
          <button type="submit" style={{ width: "100%", padding: "12px", borderRadius: 999, border: "none", background: C.coral, color: C.accentText, fontFamily: BODY_FONT, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            Save changes
          </button>
          {saved && <div style={{ fontFamily: BODY_FONT, fontSize: 12, color: C.coralSolid, marginTop: 10, textAlign: "center" }}>Saved.</div>}
        </div>
      </form>
    </div>
  );
}
