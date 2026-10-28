import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BODY_FONT } from "../styles/theme";

const TABS = [
  { id: "home", label: "Home", to: "/" },
  { id: "wishlist", label: "Wishlist", to: "/wishlist" },
  { id: "myott", label: "My OTT", to: "/my-ott" },
];

export default function Tabs({ C }) {
  const [hovered, setHovered] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const activeId = TABS.find((t) => t.to === location.pathname)?.id || "home";

  return (
    <div style={{ display: "flex", justifyContent: "center", width: "100%", background: "trasnparent"}}>
      <div style={{   display: "flex",
    justifyContent: "center",
    gap: 4,
    width: "fit-content",
    margin: "0 auto 22px",
    padding: "3px 5px",
    borderRadius: 999,
    background: "rgba(10, 10, 14, 0.35)",
  }}>
        {TABS.map((t) => {
          const isSelected = activeId === t.id;
          const isHovered = hovered === t.id && !isSelected;
          return (
            <button
              key={t.id}
              onClick={() => navigate(t.to)}
              onMouseEnter={() => setHovered(t.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                padding: "9px 20px",
                borderRadius: 999,
                cursor: "pointer",
                fontFamily: BODY_FONT,
                fontSize: 13,
                fontWeight: 600,
                transition: "all 0.15s ease",
                background: isHovered ? C.coral : isSelected ? C.glass : "transparent",
                color: isHovered ? C.accentText : isSelected ? C.coralSolid : C.muted,
                boxShadow: isHovered ? `0 4px 14px ${C.accentShadow}` : isSelected ? C.glassShadow : "none",
                border: isSelected ? `1px solid ${C.glassBorder}` : "1px solid transparent",
                backdropFilter: isSelected ? "blur(10px)" : "none",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
