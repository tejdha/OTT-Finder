import React from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Star as StarIcon } from "lucide-react";
import { glassStyle, DISPLAY_FONT, BODY_FONT } from "../styles/theme";
import { Sheen } from "./Primitives";

// movie shape now comes from src/api/adapters.js — see that file for fields.
export function PosterCard({ movie, C, wishlisted, onToggleWishlist, ownedProviderIds = [], showProviders = false, browsingCountry=null, }) {
  const navigate = useNavigate();
  const mediaType = movie.tmdbMediaType || movie.type || "movie";
  
  const allProviders = [
    ...(movie.watchProviders?.flatrate || []),
    ...(movie.watchProviders?.rent || []),
    ...(movie.watchProviders?.buy || []),
    ...(movie.watchProviders?.free || []),
  ];
  const hasOwned = allProviders.some((p) => ownedProviderIds.includes(p.id));

  return (
   <div
  onClick={() => {
    const resultsPanel = document.getElementById(
    "home-results-panel"
  );

  if (resultsPanel) {
    sessionStorage.setItem(
      "ott-home-scroll-position",
      String(resultsPanel.scrollTop)
    );
  }

    navigate(`/title/${mediaType}/${movie.id}`, {
      state: { browsingCountry },
    });
  }}
  style={{
    cursor: "pointer",
    position: "relative",
  }}
>
      <Sheen C={C} />
      <div style={{ position: "relative", overflow: "hidden", borderRadius: 12, aspectRatio: "2/3" }}>
        {movie.poster ? (
          <img src={movie.poster} alt={movie.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: C.iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: BODY_FONT, fontSize: 11, color: C.muted, textAlign: "center", padding: 8 }}>
            No poster
          </div>
        )}
        {hasOwned && <div style={{ position: "absolute", top: 8, left: 8, padding: "4px 9px", borderRadius: 999, background: C.green, fontFamily: BODY_FONT, fontSize: 10, fontWeight: 600, color: "#fff" }}>You have this</div>}
        <button onClick={(e) => { e.stopPropagation(); onToggleWishlist({ id: movie.id, mediaType }); }} style={{ position: "absolute", top: 8, right: 8, width: 30, height: 30, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <Heart size={14} color={wishlisted ? C.coralSolid : "#F2F2F5"} fill={wishlisted ? C.coralSolid : "none"} />
        </button>
      </div>
      <div style={{ position: "relative", marginTop: 10, padding: "0 4px 4px" }}>
        <div style={{ fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: 14, color: C.text, lineHeight: 1.3 }}>{movie.title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
          <span style={{ fontSize: 11, color: C.muted, fontFamily: BODY_FONT }}>{movie.year}</span>
          <StarIcon size={11} fill="#F5B942" color="#F5B942" />
          <span style={{ fontSize: 11, color: "#F5B942", fontFamily: BODY_FONT, fontWeight: 600 }}>{movie.rating}</span>
        </div>
        {showProviders && allProviders.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
            {allProviders.slice(0, 4).map((p) => (
              <span key={p.id} style={{ fontFamily: BODY_FONT, fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 999, background: "transparent", color: ownedProviderIds.includes(p.id) ? "#fff" : C.muted }}>
                {p.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Renders a real provider logo when available, falling back to a monogram badge.
export function ProviderIcon({ provider, C, size = 36 }) {
  if (!provider) return null;
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.28, background: C.iconBg, border: `1px solid ${C.iconBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
      {provider.logo ? (
        <img src={provider.logo} alt={provider.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      ) : (
        <span style={{ fontFamily: DISPLAY_FONT, fontWeight: 800, fontSize: size * 0.42, color: C.text }}>{provider.name?.charAt(0)}</span>
      )}
    </div>
  );
}

const CATEGORY_LABELS = { flatrate: "Subscription", rent: "Rent", buy: "Buy", free: "Free", ads: "Free with ads" };

export function ProviderPill({ provider, categories, C, owned, price }) {
  const clickable = Boolean(provider?.url);

  return (
    <div onClick={()=>{
      if (provider?.url){
        window.open(provider.url, "_blank", "noopener,noreferrer");
      }
    }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 16, minWidth: 180, ...glassStyle(C) }}>
      <Sheen C={C} />
      <div style={{ position: "relative" }}><ProviderIcon provider={provider} C={C} /></div>
      <div style={{ position: "relative" }}>
        <div style={{ fontFamily: BODY_FONT, fontWeight: 600, fontSize: 13, color: C.text }}>{provider.name}</div>
        <div style={{ fontFamily: BODY_FONT, fontSize: 11, marginTop: 2, fontWeight: 600, color: owned ? C.greenSolid : C.coralSolid }}>
          {owned
            ? "You already have this"
            : categories
            .map((category) => CATEGORY_LABELS[category] || category)
            .join(" • ")
          }
        </div>
      </div>

       {price && (
      <div
        style={{
          position: "relative",
          marginLeft: "auto",
          flexShrink: 0,
          fontFamily: BODY_FONT,
          fontSize: 13,
          fontWeight: 700,
          color: C.text,
          whiteSpace: "nowrap",
        }}
      >
        {price}
      </div>
    )}
  </div>
);
}
