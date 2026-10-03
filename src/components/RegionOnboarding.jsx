import React, { useState } from "react";
import { MapPin, X } from "lucide-react";
import { ALL_COUNTRIES } from "../api/regions";
import { BODY_FONT, DISPLAY_FONT, glassStyle } from "../styles/theme";
import { Sheen } from "./Primitives";

export default function RegionOnboarding({
  C,
  onSelectCountry,
  onDetectLocation,
  locating,
  onClose,
}) {
  const [selectedCountry, setSelectedCountry] = useState("");

  const handleContinue = () => {
    if (!selectedCountry) return;
    onSelectCountry(selectedCountry);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "rgba(0, 0, 0, 0.58)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div
        style={{
            position: "relative",
          width: "100%",
          maxWidth: 460,
          padding: 30,
          borderRadius: 24,
          textAlign: "center",
          ...glassStyle(C),
        }}
      >
        <button
  onClick={onClose}
  aria-label="Close"
  style={{
    position: "absolute",
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: `1px solid ${C.glassBorder}`,
    background: "transparent",
    color: C.muted,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  }}
>
  <X size={16} />
</button>
        <Sheen C={C} />

        <div style={{ position: "relative" }}>
          <div
            style={{
              width: 52,
              height: 52,
              margin: "0 auto 16px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: C.iconBg,
              border: `1px solid ${C.iconBorder}`,
            }}
          >
            <MapPin size={22} color={C.text} />
          </div>

          <h2
            style={{
              margin: "0 0 8px",
              fontFamily: DISPLAY_FONT,
              fontSize: 24,
              fontWeight: 800,
              color: C.text,
            }}
          >
            Where do you watch from?
          </h2>

          <p
            style={{
              margin: "0 auto 22px",
              maxWidth: 360,
              fontFamily: BODY_FONT,
              fontSize: 13,
              lineHeight: 1.6,
              color: C.muted,
            }}
          >
            Choose your country so we can show the streaming platforms and
            availability relevant to your region.
          </p>

          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 12,
              border: `1px solid ${C.glassBorder}`,
              background: C.selectBg,
              color: C.selectText,
              fontFamily: BODY_FONT,
              fontSize: 13,
              outline: "none",
            }}
          >
            <option
              value=""
              style={{
                background: C.selectBg,
                color: C.selectText,
              }}
            >
              Select your country
            </option>

            {ALL_COUNTRIES.map((country) => (
              <option
                key={country}
                value={country}
                style={{
                  background: C.selectBg,
                  color: C.selectText,
                }}
              >
                {country}
              </option>
            ))}
          </select>

          <button
            onClick={handleContinue}
            disabled={!selectedCountry}
            style={{
              width: "100%",
              marginTop: 12,
              padding: "12px 16px",
              borderRadius: 999,
              border: "none",
              background: selectedCountry ? C.coral : C.iconBg,
              color: selectedCountry ? C.accentText : C.muted,
              fontFamily: BODY_FONT,
              fontSize: 13,
              fontWeight: 700,
              cursor: selectedCountry ? "pointer" : "not-allowed",
              opacity: selectedCountry ? 1 : 0.7,
            }}
          >
            Continue
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              margin: "18px 0",
            }}
          >
            <div
              style={{
                flex: 1,
                height: 1,
                background: C.glassBorder,
              }}
            />
            <span
              style={{
                fontFamily: BODY_FONT,
                fontSize: 11,
                color: C.muted,
              }}
            >
              or
            </span>
            <div
              style={{
                flex: 1,
                height: 1,
                background: C.glassBorder,
              }}
            />
          </div>

          <button
            onClick={onDetectLocation}
            disabled={locating}
            style={{
              width: "100%",
              padding: "11px 16px",
              borderRadius: 999,
              border: `1px solid ${C.glassBorder}`,
              background: "transparent",
              color: C.text,
              fontFamily: BODY_FONT,
              fontSize: 12,
              fontWeight: 600,
              cursor: locating ? "wait" : "pointer",
            }}
          >
            <MapPin size={13} style={{ verticalAlign: "middle", marginRight: 6 }} />
            {locating ? "Detecting..." : "Detect my region"}
          </button>
        </div>
      </div>
    </div>
  );
}