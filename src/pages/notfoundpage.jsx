import React from "react";
import { useNavigate } from "react-router-dom";
import { DISPLAY_FONT, BODY_FONT } from "../styles/theme";

export default function NotFoundPage({
  C,
  title = "Page not found",
  message = "The page you're looking for doesn't exist or has moved.",
}) {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", padding: "80px 0" }}>
      <h1 style={{ fontFamily: DISPLAY_FONT, fontWeight: 800, fontSize: 24, color: C.text, margin: "0 0 10px 0" }}>
        {title}
      </h1>
      <p style={{ fontFamily: BODY_FONT, fontSize: 14, color: C.muted, margin: "0 0 20px 0" }}>
        {message}
      </p>
      <button
        onClick={() => navigate("/")}
        style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.iconBorder}`, background: "transparent", color: C.text, fontFamily: BODY_FONT, fontSize: 14, cursor: "pointer" }}
      >
        Go to home
      </button>
    </div>
  );
}