import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { BODY_FONT } from "../styles/theme";
import { ALL_COUNTRIES } from "../api/regions";
import { useOutsideClose } from "./Primitives";

export default function RegionSelect({
  selectedCountryName,
  onManualSelect,
  C,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  const searchRef = useRef(null);

  useOutsideClose(ref, () => {
    setOpen(false);
    setSearch("");
  });

  const selected = !!selectedCountryName;

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [open]);

  const filteredCountries = ALL_COUNTRIES.filter((country) =>
    country.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        display: "inline-block",
        zIndex: open ? 1000 : 1,
      }}
      onMouseEnter={()=> setOpen(true)}
      onMouseLeave={()=>{
        setOpen(false);
        setSearch("")
      }}
    >
      <button
        type="button"
        onMouseEnter={() => {
          setOpen(true);
          setSearch("");
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 14px",
          borderRadius: 999,
          border: `1px solid ${
            selected ? C.coralSolid : C.glassBorder
          }`,
          background: selected ? C.glass : "transparent",
          cursor: "pointer",
          fontFamily: BODY_FONT,
          fontSize: 12,
          fontWeight: 600,
          color: selected ? C.coralSolid : C.muted,
          whiteSpace: "nowrap",
          outline: "none",
        }}
      >
        {selectedCountryName || "Select country"}

        <ChevronDown
          size={13}
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s ease",
          }}
        />
      </button>

      {open && (
        <>
          <style>
            {`
              .country-dropdown-list {
                scrollbar-width: none;
                -ms-overflow-style: none;
              }

              .country-dropdown-list::-webkit-scrollbar {
                display: none;
                width: 0;
                height: 0;
              }
            `}
          </style>

          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              width: 210,
              maxHeight: 300,
              borderRadius: 14,
              zIndex: 100,
              background: C.glass,
              border: `1px solid ${C.glassBorder}`,
              boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              boxSizing: "border-box",
              overflow: "hidden",
            }}
          >

            {/* Search */}
            <div
              style={{
                position: "sticky",
                top: 0,
                padding: 8,
                borderBottom: `1px solid ${C.glassBorder}`,
                background: C.glass,
                zIndex: 2,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "7px 9px",
                  borderRadius: 9,
                  border: `1px solid ${C.glassBorder}`,
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                <Search
                  size={13}
                  color={C.muted}
                  style={{ flexShrink: 0 }}
                />

                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search country..."
                  style={{
                    width: "100%",
                    minWidth: 0,
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    color: C.text,
                    fontFamily: BODY_FONT,
                    fontSize: 12,
                  }}
                />
              </div>
            </div>

            {/* Countries */}
            <div
              className="country-dropdown-list"
              style={{
                maxHeight: 235,
                overflowY: "auto",
                padding: "4px 6px 6px",
              }}
            >
              {filteredCountries.length === 0 ? (
                <div
                  style={{
                    padding: "14px 10px",
                    fontFamily: BODY_FONT,
                    fontSize: 12,
                    color: C.muted,
                    textAlign: "center",
                  }}
                >
                  No countries found
                </div>
              ) : (
                filteredCountries.map((country, index) => {
                  const isSelected =
                    country === selectedCountryName;

                  return (
                    <button
                      key={country}
                      type="button"
                      onClick={() => {
                        onManualSelect(country);
                        setOpen(false);
                        setSearch("");
                      }}
                      style={{
                        position: "relative",
                        display: "block",
                        width: "100%",
                        padding: "8px 10px",
                        border: "none",
                        borderBottom:
                          index < filteredCountries.length - 1
                            ? `1px solid ${C.glassBorder}`
                            : "none",
                        borderRadius: 8,
                        background: isSelected
                          ? C.glass
                          : "transparent",
                        color: isSelected
                          ? C.coralSolid
                          : C.text,
                        fontFamily: BODY_FONT,
                        fontSize: 12,
                        fontWeight: isSelected ? 700 : 500,
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      {country}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}