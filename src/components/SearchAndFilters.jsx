import React, { useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { glassStyle, BODY_FONT } from "../styles/theme";
import { Sheen, useOutsideClose } from "./Primitives";

export function SearchBar({ value, onChange, C }) {
  return (
    <div
      style={{
        maxWidth: 480,
        margin: "0 auto",
        borderRadius: 999,
        ...glassStyle(C),
        display: "flex",
        alignItems: "center",
      }}
    >
      <Sheen C={C} />

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search for a movie..."
        style={{
          position: "relative",
          flex: 1,
          minWidth: 0,
          width: "100%",
          boxSizing: "border-box",
          padding: "14px 20px",
          fontSize: 15,
          fontFamily: BODY_FONT,
          background: "transparent",
          border: "none",
          color: C.text,
          outline: "none",
        }}
      />

      {value && (
        <button
          onClick={() => onChange("") 
          }
          aria-label="Clear search"
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 10,
            padding: 6,
            border: "none",
            borderRadius: "50%",
            background: "transparent",
            color: C.muted,
            cursor: "pointer"
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

export function FilterDropdown({ label, options, selected, onToggle, C }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  useOutsideClose(ref, () => setOpen(false));
  const shown = options.filter((o) => String(o).toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{ position: "relative" }} ref={ref} onMouseEnter={()=> setOpen(true)} onMouseLeave={()=>setOpen(false)}>
      <button onMouseEnter={() => setOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 999, border: `1px solid ${selected.length ? C.coralSolid : C.glassBorder}`, background: selected.length ? C.glass : "transparent", cursor: "pointer", fontFamily: BODY_FONT, fontSize: 12, fontWeight: 600, color: selected.length ? C.coralSolid : C.muted }}>
        {label}{selected.length > 0 ? ` (${selected.length})` : ""} <ChevronDown size={13} />
      </button>
      {open && (
        <div style={{ ...glassStyle(C), position: "absolute", top: "100%", left: 0, width: 200, borderRadius: 14, padding: 10, zIndex: 25 }}>
          <Sheen C={C} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${label.toLowerCase()}...`}
            style={{ position: "relative", width: "100%", boxSizing: "border-box", padding: "8px 10px", marginBottom: 8, borderRadius: 8, border: `1px solid ${C.glassBorder}`, background: "transparent", color: C.text, fontFamily: BODY_FONT, fontSize: 12, outline: "none" }} />
          <div style={{ position: "relative", maxHeight: 180, overflowY: "auto", scrollbarWidth: "none", msOverflowStyle: "none",}}>
            {shown.map((o) => (
              <label key={o} 
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                fontSize: 12,
                fontFamily: BODY_FONT,
                color: C.text,
                cursor: "pointer",
                borderBottom:
                  shown.indexOf(o) < shown.length - 1
                    ? `1px solid ${C.glassBorder}`
                    : "none",
                boxSizing: "border-box",
              }}>
                <input type="checkbox" checked={selected.includes(o)} onChange={() => onToggle(o)} 
                  style={{
                    position: "absolute",
                    opacity: 0,
                    width: 1,
                    height: 1,
                    pointerEvents: "none",
                  }}
                />
                 <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 4,
                    border: `1px solid ${
                      selected.includes(o) ? C.coralSolid : "#666"
                    }`,
                    background: selected.includes(o)
                      ? C.coralSolid
                      : "rgba(255,255,255,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxSizing: "border-box",
                  }}
                >
                  {selected.includes(o) && (
                    <span
                      style={{
                        width: 6,
                        height: 3,
                        borderLeft: "2px solid white",
                        borderBottom: "2px solid white",
                        transform: "rotate(-45deg) translate(1px, -1px)",
                      }}
                    />
                  )}
                </span>
                {o}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


export function SortDropdown({ value, onChange, C }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutsideClose(ref, () => setOpen(false));
  const options = [
    { id: "none", label: "Sort" },
    { id: "az", label: "A - Z" },
    { id: "za", label: "Z - A" },
    { id: "popular", label: "Most popular" },
    { id: "latest", label: "Latest" },
    { id: "oldest", label: "Oldest" },
    { id: "toprated", label: "Top rated" },
  ];
  const current = options.find((o) => o.id === value) || options[0];
  return (
    <div style={{ position: "relative" }} ref={ref} onMouseEnter={()=> setOpen(true)} onMouseLeave={()=>setOpen(false)}>
      <button onMouseEnter={() => setOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 999, border: `1px solid ${value !== "none" ? C.coralSolid : C.glassBorder}`, background: value !== "none" ? C.glass : "transparent", cursor: "pointer", fontFamily: BODY_FONT, fontSize: 12, fontWeight: 600, color: value !== "none" ? C.coralSolid : C.muted }}>
        {current.label} <ChevronDown size={13} />
      </button>
      {open && (
        <div style={{ ...glassStyle(C), position: "absolute", top: "100%", left: 0, width: 160, borderRadius: 14, padding: 6, zIndex: 25 }}>
          <Sheen C={C} />
          {options.map((o) => (
            <div key={o.id} onClick={() => { onChange(o.id); setOpen(false); }}
             style={{
              position: "relative",
              padding: "8px 10px",
              fontSize: 12,
              fontFamily: BODY_FONT,
              color: o.id === value ? C.coralSolid : C.text,
              fontWeight: o.id === value ? 700 : 500,
              cursor: "pointer",
              borderBottom:
                o.id !== options[options.length - 1].id
                  ? `1px solid ${C.glassBorder}`
                  : "none",
            }}>
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
