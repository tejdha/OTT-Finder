import React from "react";
import { glassStyle, DISPLAY_FONT, BODY_FONT } from "../styles/theme";
import { Sheen } from "../components/Primitives";

function SettingRow({ label, description, control, C }) {
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: `1px solid ${C.glassBorder}` }}>
      <div>
        <div style={{ fontFamily: BODY_FONT, fontSize: 14, fontWeight: 600, color: C.text }}>{label}</div>
        {description && <div style={{ fontFamily: BODY_FONT, fontSize: 12, color: C.muted, marginTop: 2 }}>{description}</div>}
      </div>
      {control}
    </div>
  );
}

export default function SettingsPage({ C, theme, onToggleTheme }) {
  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <h1 style={{ fontFamily: DISPLAY_FONT, fontWeight: 800, fontSize: 22, color: C.text, margin: "0 0 18px 0" }}>Settings</h1>
      <div style={{ ...glassStyle(C, { padding: "6px 20px", borderRadius: 18 }) }}>
        <Sheen C={C} />
        <SettingRow
          C={C}
          label="Theme"
          description="Switch between light and dark mode."
          control={
            <button onClick={onToggleTheme} style={{ padding: "8px 14px", borderRadius: 999, border: "none", background: C.coral, color: C.accentText, fontFamily: BODY_FONT, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              {theme === "dark" ? "Switch to light" : "Switch to dark"}
            </button>
          }
        />
        <SettingRow C={C} label="Notifications" description="Get notified about price drops and new releases." control={<input type="checkbox" defaultChecked style={{ accentColor: C.coralSolid, width: 18, height: 18 }} />} />
        <SettingRow C={C} label="Region auto-detect" description="Ask before checking your region automatically." control={<input type="checkbox" style={{ accentColor: C.coralSolid, width: 18, height: 18 }} />} />
      </div>
    </div>
  );
}
