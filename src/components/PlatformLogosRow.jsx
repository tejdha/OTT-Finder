import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { glassStyle, DISPLAY_FONT, BODY_FONT } from "../styles/theme";
import { getWatchProviderList } from "../api/tmdb";
import { adaptProviderList } from "../api/adapters";
import { Sheen } from "./Primitives";
import { ProviderIcon } from "./Cards";

export default function PlatformLogosRow({ C, watchRegion, ownedProviderIds }) {
  const navigate = useNavigate();
  const [providers, setProviders] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getWatchProviderList("movie", watchRegion)
  .then((list) => {
    if (cancelled) return;

    const allProviders = adaptProviderList(list);

    const ownedSet = new Set(
      (ownedProviderIds || []).map(Number)
    );

    // User-owned providers first
    const ownedProviders = allProviders.filter((p) =>
      ownedSet.has(Number(p.id))
    );

    // Popular providers, excluding owned ones
    const popularProviders = allProviders.filter(
      (p) => !ownedSet.has(Number(p.id))
    );

    // Always keep the row at a maximum of 12 platforms
    const finalProviders = [
      ...ownedProviders,
      ...popularProviders,
    ].slice(0, 12);

    setProviders(finalProviders);
  })
  .catch(() => !cancelled && setProviders([]));
    return () => { cancelled = true; };
  }, [watchRegion]);

  if (providers.length === 0) return null;

  return (
    <div style={{  marginBottom: 30 }}>
      <h3 style={{  fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: 17, color: C.text, margin: "0 0 50px 0" }}>Browse by Platform</h3>
      <div className="hide-scrollbar" style={{  display: "flex", justifyContent: "space-around", overflowX: "auto", paddingBottom: 6 }}>
        {providers.map((p) => (
          <button
            key={p.id}
            onClick={() => navigate(`/platform/${p.id}`, { state: { name: p.name } })}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              width : 90,
              flexShrink: 0,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              position: "relative",
            }}
          >
            {/* <Sheen C={C} /> */}
            <div style={{ position: "relative" }}><ProviderIcon provider={p} C={C} size={53} /></div>
            <span
              style={{
                position: "relative",
                width: "100%",
                fontFamily: BODY_FONT,
                fontSize: 11,
                fontWeight: 600,
                color: C.text,
                textAlign: "center",
                lineHeight: 1.2,
                whiteSpace: "normal",
                overflowWrap: "break-word",
              }}
              >{p.name}
              </span>
            </button>
          ))}
       </div>
      </div>
    );
}
