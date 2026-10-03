import React from "react";

export function Sheen({ C }) {
  return <div style={{ position: "absolute", inset: 0, background: C.sheen, pointerEvents: "none" }} />;
}

export function IconButton({ children, onClick, C, badge, gradient }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "relative",
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: gradient || C.iconBg,
        border: gradient ? "none" : `1px solid ${C.iconBorder}`,
        color: gradient ? "#fff" : C.text,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        boxShadow: gradient ? `0 4px 14px ${C.accentShadow}` : "0 3px 10px rgba(0,0,0,0.12)",
      }}
    >
      {children}
      {badge ? (
        <span
          style={{
            position: "absolute",
            top: -2,
            right: -2,
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: C.coralSolid,
            border: "2px solid rgba(0,0,0,0.4)",
          }}
        />
      ) : null}
    </button>
  );
}

export function useOutsideClose(ref, onClose) {
  React.useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [ref, onClose]);
}
