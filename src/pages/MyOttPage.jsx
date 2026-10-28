import React, { useEffect, useState } from "react";
import { Plus, MapPin, Languages, Cast, Music, RemoveFormattingIcon } from "lucide-react";
import { glassStyle, DISPLAY_FONT, BODY_FONT } from "../styles/theme";
import { getWatchProviderList } from "../api/tmdb";
import { adaptProviderList } from "../api/adapters";
import RegionSelect from "../components/RegionSelect";
import { toIsoRegion } from "../api/regions";

import { Sheen } from "../components/Primitives";
import { ProviderIcon } from "../components/Cards";
import { PlatformSection } from "../components/Sections";

function RegionBar({ userCountry, onManualCountry, onDetectLocation, locating,C }) { // 
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "center", marginBottom: 20 }}>
      <button onClick={onDetectLocation} disabled={locating} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 999, border: "none", cursor: "pointer", fontFamily: BODY_FONT, fontSize: 12, fontWeight: 600, color: C.text, ...glassStyle(C) }}>
        <Sheen C={C} /><MapPin size={13} style={{ position: "relative" }} /><span style={{ position: "relative" }}>{locating ? "Detecting..." : "Detect my region"}</span>
      </button>
      <span style={{ fontFamily: BODY_FONT, fontSize: 12, color: C.muted }}>or</span>

      <RegionSelect
        selectedCountryName={userCountry}
        onManualSelect={onManualCountry}
        C={C}
      />
      {userCountry && <span style={{ fontFamily: BODY_FONT, fontSize: 12, color: C.muted }}>Showing platforms available in {userCountry}</span>}
    </div>
  );
}

export default function MyOttPage({ C, owned, onToggle, wishlist, onToggleWishlist, onDetectLocation, userCountry, onManualCountry, locating, watchRegion }) {
  const [managing, setManaging] = useState(owned.length === 0);
  const [allProviders, setAllProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(true);

  const [visibleProviders, setVisibleProviders] = useState(12);
  const [temporaryCountry, setTemporaryCountry ] = useState(null);

  const effectiveCountry = temporaryCountry || userCountry;
  const effectiveWatchRegion = toIsoRegion(effectiveCountry);

  const [detectingLocation, setDetectingLocation] = useState(false);
  const handleDetectLocation = () => {
  // ...
};
useEffect(() => {
  // ...
}, [effectiveWatchRegion]);

  useEffect(() => {
    let cancelled = false;

    setVisibleProviders(12);
    setLoadingProviders(true);

    getWatchProviderList("movie", effectiveWatchRegion)
      .then((list) => {
        if(!cancelled){
          setAllProviders(adaptProviderList(list, effectiveWatchRegion));
        }
      })
      .catch(() => !cancelled && setAllProviders([]))
      .finally(() => !cancelled && setLoadingProviders(false));

    return () => { cancelled = true; };

  }, [effectiveWatchRegion]);

  const ownedProviderObjs = allProviders.filter((p) => owned.includes(p.id));

  const orderedProviders = [
  ...allProviders.filter((p) => owned.includes(p.id)),
  ...allProviders.filter((p) => !owned.includes(p.id)),
];

  if (managing) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ fontFamily: BODY_FONT, fontSize: 13, color: C.muted, marginBottom: 8, textAlign: "center" }}>
          Select the platforms you already have. We'll personalize recommendations around them.
        </div>
        <RegionBar userCountry={effectiveCountry} onManualCountry={setTemporaryCountry} onDetectLocation={handleDetectLocation} locating={detectingLocation} C={C} />

        {loadingProviders ? (
          <div style={{ fontFamily: BODY_FONT, fontSize: 13, color: C.muted, textAlign: "center" }}>Loading platforms...</div>
        ) : (
          <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12 }}>
            {orderedProviders.slice(0, visibleProviders).map((p) => {
              const isOwned = owned.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => onToggle(p.id)}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "16px 10px", borderRadius: 16, cursor: "pointer", textAlign: "center", position: "relative", ...glassStyle(C), border: isOwned ? `2px solid ${C.coralSolid}` : `1px solid ${C.glassBorder}` }}
                >
                  <Sheen C={C} />
                  <div style={{ position: "absolute", top: 8, right: 8, width: 20, height: 20, borderRadius: "50%", background: isOwned ? C.coral : "transparent", border: isOwned ? "none" : `2px solid ${C.iconBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {isOwned ? <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>&#10003;</span> : <Plus size={10} color={C.muted} />}
                  </div>
                  <ProviderIcon provider={p} C={C} size={40} />
                  <span style={{ position: "relative", fontFamily: BODY_FONT, fontSize: 12, fontWeight: 600, color: C.text, lineHeight: 1.2 }}>{p.name}</span>
                </button>
              );
            })}
          </div>
         <div style={{display: "flex", justifyContent: "center", gap: 10, marginTop: 18,}}> 
          {visibleProviders < allProviders.length && (
              <button
                onClick={() =>
                  setVisibleProviders((prev) =>
                    Math.min(prev + 12, allProviders.length)
                  )
                }
                style={{
                  display: "block",
                  margin: "18px auto 0",
                  padding: "10px 18px",
                  borderRadius: 999,
                  border: `1px solid ${C.glassBorder}`,
                  background: "transparent",
                  color: C.text,
                  fontFamily: BODY_FONT,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Load More
              </button>
            )}

          {visibleProviders > 12 && (
            <button
              onClick={() =>
                setVisibleProviders((prev) =>
                  Math.max(prev - 12, 12)
                )
              }
              style={{
                display: "block",
                margin: "18px auto 0",
                padding: "10px 18px",
                borderRadius: 999,
                border: `1px solid ${C.glassBorder}`,
                background: "transparent",
                color: C.text,
                fontFamily: BODY_FONT,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Load Less
            </button>
          )}
          </div>
        </>
          
        )}
        {owned.length > 0 && (
          <button onClick={() => setManaging(false)} style={{ marginTop: 22, width: "100%", padding: "13px", borderRadius: 999, border: "none", background: C.coral, color: C.accentText, fontFamily: BODY_FONT, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            Done
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button onClick={() => setManaging(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 999, border: "none", cursor: "pointer", fontFamily: BODY_FONT, fontSize: 12, fontWeight: 600, color: C.text, ...glassStyle(C) }}>
          <Sheen C={C} /><Plus size={14} style={{ position: "relative" }} /><span style={{ position: "relative" }}>Edit platforms</span>
        </button>
      </div>
      {ownedProviderObjs.map((p) => (
        <PlatformSection key={p.id} providerId={p.id} providerName={p.name} watchRegion={effectiveWatchRegion} C={C} wishlist={wishlist} onToggleWishlist={onToggleWishlist} ownedProviderIds={owned} />
      ))}
    </div>
  );
}


const handleDetectLocation = () => {
  if (!navigator.geolocation) return;

  setDetectingLocation(true);

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        const res = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`
        );

        const data = await res.json();

        const detectedCountry = data.countryName || null;

        if (detectedCountry) {
          setTemporaryCountry(null);
          onManualCountry(detectedCountry);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setDetectingLocation(false);
      }
    },
    (error) => {
      console.error( error);
      setDetectingLocation(false);
    }
  );
};




