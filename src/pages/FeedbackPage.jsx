import React, { useState } from "react";
import { glassStyle, DISPLAY_FONT, BODY_FONT } from "../styles/theme";
import { Sheen } from "../components/Primitives";

export default function FeedbackPage({ C }) {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // NOTE: no backend yet — this just simulates submission for the prototype.
    setSent(true);
    setMessage("");
  };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <h1 style={{ fontFamily: DISPLAY_FONT, fontWeight: 800, fontSize: 22, color: C.text, margin: "0 0 6px 0" }}>Send feedback</h1>
      <p style={{ fontFamily: BODY_FONT, fontSize: 13, color: C.muted, margin: "0 0 18px 0" }}>Tell us what's working or what's missing.</p>
      <form onSubmit={handleSubmit} style={{ ...glassStyle(C, { padding: 20, borderRadius: 16 }) }}>
        <Sheen C={C} />
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Your feedback..."
          rows={5}
          style={{ position: "relative", width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 10, border: `1px solid ${C.glassBorder}`, background: "transparent", color: C.text, fontFamily: BODY_FONT, fontSize: 14, outline: "none", marginBottom: 14, resize: "vertical" }}
        />
        <button type="submit" style={{ position: "relative", width: "100%", padding: "12px", borderRadius: 999, border: "none", background: C.coral, color: C.accentText, fontFamily: BODY_FONT, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          Submit
        </button>
        {sent && <div style={{ position: "relative", fontFamily: BODY_FONT, fontSize: 12, color: C.coralSolid, marginTop: 10, textAlign: "center" }}>Thanks for the feedback!</div>}
      </form>
    </div>
  );
}
