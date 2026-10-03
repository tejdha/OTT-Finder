import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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

export default function SignupPage({ C, onLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // NOTE: no real backend yet — this just simulates account creation for the prototype.
    onLogin({ name, email });
    navigate("/my-ott");
  };

  return (
    <div style={{ maxWidth: 380, margin: "60px auto", ...glassStyle(C, { padding: 28, borderRadius: 20 }) }}>
      <Sheen C={C} />
      <h1 style={{ position: "relative", fontFamily: DISPLAY_FONT, fontWeight: 800, fontSize: 24, color: C.text, margin: "0 0 6px 0" }}>Create your account</h1>
      <p style={{ position: "relative", fontFamily: BODY_FONT, fontSize: 13, color: C.muted, margin: "0 0 22px 0" }}>Takes less than a minute.</p>
      <form onSubmit={handleSubmit} style={{ position: "relative" }}>
        <input required placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle(C)} />
        <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle(C)} />
        <input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle(C)} />
        <button type="submit" style={{ width: "100%", padding: "13px", borderRadius: 999, border: "none", background: C.coral, color: C.accentText, fontFamily: BODY_FONT, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          Sign up
        </button>
      </form>
      <p style={{ position: "relative", fontFamily: BODY_FONT, fontSize: 12, color: C.muted, marginTop: 18, textAlign: "center" }}>
        Already have an account? <Link to="/login" style={{ color: C.coralSolid, fontWeight: 600 }}>Log in</Link>
      </p>
    </div>
  );
}
