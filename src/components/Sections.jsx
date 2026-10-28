import React, { useEffect, useState } from "react";
import { DISPLAY_FONT, BODY_FONT } from "../styles/theme";
import { discover, getGenreMap } from "../api/tmdb";
import { adaptListResponse } from "../api/adapters";
import { registerItems } from "../api/movieCache";
import { PosterCard, ProviderIcon } from "./Cards";

export function Row({ title, items, C, wishlist, onToggleWishlist, ownedProviderIds, onSeeAll, loading, browsingCountry }) {
  
  if (!loading && items.length === 0) return null;
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h3 style={{ fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: 17, color: C.text, margin: 0 }}>{title}</h3>
        {onSeeAll && !loading && <button onClick={onSeeAll} style={{ background: "none", border: "none", color: C.coralSolid, fontFamily: BODY_FONT, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>See all</button>}
      </div>
      {loading ? (
        <div style={{ fontFamily: BODY_FONT, fontSize: 12, color: C.muted }}>Loading...</div>
      ) : (
        <div className="hide-scrollbar" style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 6,}}>
          {items.slice(0, 20).map((m) => (
            <div key={`${m.tmdbMediaType}-${m.id}`} style={{ flexShrink: 0, width: 128 }}>
              <PosterCard movie={m} C={C} wishlisted={wishlist.some((w) => w.id === m.id && w.mediaType === m.tmdbMediaType)} onToggleWishlist={onToggleWishlist} ownedProviderIds={ownedProviderIds} browsingCountry={browsingCountry} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Fetches a provider's catalog live from TMDB's /discover endpoint, tabbed by category.
export function PlatformSection({ providerId, providerName, watchRegion, browsingCountry, C, wishlist, onToggleWishlist, ownedProviderIds, onSeeAll, initialCat = "trending", onTabChange,}) {
  const [activeCat, setActiveCat] = useState(initialCat);
  const [hovered, setHovered] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const cats = [{ id: "trending", label: "Trending" }, { id: "latest", label: "Latest" }, { id: "movies", label: "Movies" }, { id: "series", label: "Series" }];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const sortBy = activeCat === "latest" ? "primary_release_date.desc" : activeCat === "trending" ? "popularity.desc" : "vote_average.desc";
    const mediaType = activeCat === "series" ? "tv" : "movie"; // "movies" and "trending"/"latest" default to movie catalog
    Promise.all([discover(mediaType, { providerId, watchRegion, sortBy }), getGenreMap()])
      .then(([res, genreMap]) => {
        if (cancelled) return;
        const adapted = adaptListResponse(res, genreMap);
        registerItems(adapted);
        setItems(adapted);
      })
      .catch(() => !cancelled && setItems([]))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [providerId, watchRegion, activeCat]);

  return (
    <div style={{ marginBottom: 30 }}>
      <div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  }}
>
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
    }}
  >
    <ProviderIcon
      provider={{ id: providerId, name: providerName }}
      C={C}
      size={28}
    />

    <span
      style={{
        fontFamily: DISPLAY_FONT,
        fontWeight: 700,
        fontSize: 16,
        color: C.text,
      }}
    >
      {providerName}
    </span>
  </div>

  {onSeeAll && (
    <button
      onClick={() =>
        onSeeAll(
          providerId,
          providerName,
          activeCat,
        )
      }
      style={{
        background: "none",
        border: "none",
        color: C.coralSolid,
        fontFamily: BODY_FONT,
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      See all
    </button>
  )}
</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {cats.map((c) => {
          const isSelected = activeCat === c.id;
          const isHovered = hovered === c.id && !isSelected;
          return (
            <button key={c.id} onClick={() => {setActiveCat(c.id); onTabChange?.(c.id);}} onMouseEnter={() => setHovered(c.id)} onMouseLeave={() => setHovered(null)}
              style={{ padding: "6px 12px", borderRadius: 999, border: isSelected ? `1px solid ${C.glassBorder}` : "1px solid transparent", cursor: "pointer", fontFamily: BODY_FONT, fontSize: 11, fontWeight: 600,
                background: isHovered ? C.coral : isSelected ? C.glass : "transparent", color: isHovered ? C.accentText : isSelected ? C.coralSolid : C.muted, boxShadow: isHovered ? `0 4px 14px ${C.accentShadow}` : "none" }}>
              {c.label}
            </button>
          );
        })}
      </div>
      {loading ? (
        <div style={{ fontFamily: BODY_FONT, fontSize: 12, color: C.muted }}>Loading...</div>
      ) : items.length === 0 ? (
        <div style={{ fontFamily: BODY_FONT, fontSize: 12, color: C.muted }}>Nothing here yet.</div>
      ) : (
        <div>
          <div className="hide-scrollbar" style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 6,  }}>
            {items.slice(0, 20).map((m) => (
              <div key={`${m.tmdbMediaType}-${m.id}`} style={{ flexShrink: 0, width: 128 }}>
                <PosterCard movie={m} C={C} wishlisted={wishlist.some((w) => w.id === m.id && w.mediaType === m.tmdbMediaType)} onToggleWishlist={onToggleWishlist} ownedProviderIds={ownedProviderIds} browsingCountry={browsingCountry}/>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}



// Fetches one genre's catalog live, tabbed by Movies/Series.
// Pass providerId to scope results to a specific platform (used on PlatformPage);
// omit it for the genre-wide version used on Home.
export function GenreSection({ genreId, genreName, providerId, watchRegion, browsingCountry, C, wishlist, onToggleWishlist, ownedProviderIds, onSeeAll, }) {
  const [activeCat, setActiveCat] = useState("movies");
  
  const [hovered, setHovered] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const cats = [{ id: "movies", label: "Movies" }, { id: "series", label: "Series" }];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const mediaType = activeCat === "series" ? "tv" : "movie";
    Promise.all([discover(mediaType, { genreId, providerId, watchRegion, sortBy: "popularity.desc" }), getGenreMap()])
      .then(async ([res, genreMap]) => {
  if (cancelled) return;

  const adapted = adaptListResponse(res, genreMap);

  // Movies are empty → check whether this genre has series.
  if (activeCat === "movies" && adapted.length === 0) {
    const seriesRes = await discover("tv", {
      genreId,
      providerId,
      watchRegion,
      sortBy: "popularity.desc",
    });

    if (cancelled) return;

    const seriesItems = adaptListResponse(seriesRes, genreMap);

    if (seriesItems.length > 0) {
      setActiveCat("series");
      return;
    }
  }

  registerItems(adapted);
  setItems(adapted);
})
      .catch(() => !cancelled && setItems([]))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [genreId, providerId, watchRegion, activeCat]);

  return (
    <div style={{ marginBottom: 30 }}>
      <div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  }}
>
  <h3
    style={{
      fontFamily: DISPLAY_FONT,
      fontWeight: 700,
      fontSize: 16,
      color: C.text,
      margin: 0,
    }}
  >
    {genreName}
  </h3>

  {onSeeAll && (
    <button
      onClick={() => onSeeAll(genreId, genreName, activeCat)}
      style={{
        border: "none",
        background: "transparent",
        color: C.coralSolid,
        cursor: "pointer",
        fontFamily: BODY_FONT,
        fontSize: 11,
        fontWeight: 600,
        padding: "4px 0",
      }}
    >
      See all
    </button>
  )}
</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {cats.map((c) => {
          const isSelected = activeCat === c.id;
          const isHovered = hovered === c.id && !isSelected;
          return (
            <button key={c.id} onClick={() => setActiveCat(c.id)} onMouseEnter={() => setHovered(c.id)} onMouseLeave={() => setHovered(null)}
              style={{ padding: "6px 12px", borderRadius: 999, border: isSelected ? `1px solid ${C.glassBorder}` : "1px solid transparent", cursor: "pointer", fontFamily: BODY_FONT, fontSize: 11, fontWeight: 600,
                background: isHovered ? C.coral : isSelected ? C.glass : "transparent", color: isHovered ? C.accentText : isSelected ? C.coralSolid : C.muted, boxShadow: isHovered ? `0 4px 14px ${C.accentShadow}` : "none" }}>
              {c.label}
            </button>
          );
        })}
      </div>
      {loading ? (
        <div style={{ fontFamily: BODY_FONT, fontSize: 12, color: C.muted }}>Loading...</div>
      ) : items.length === 0 ? (
        <div style={{ fontFamily: BODY_FONT, fontSize: 12, color: C.muted }}>Nothing here yet.</div>
      ) : (
        <div className="hide-scrollbar" style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 6 }}>
          {items.slice(0, 20).map((m) => (
            <div key={`${m.tmdbMediaType}-${m.id}`} style={{ flexShrink: 0, width: 128 }}>
              <PosterCard movie={m} C={C} wishlisted={wishlist.some((w) => w.id === m.id && w.mediaType === m.tmdbMediaType)} onToggleWishlist={onToggleWishlist} ownedProviderIds={ownedProviderIds} browsingCountry={browsingCountry}/>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
