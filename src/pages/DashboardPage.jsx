import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { glassStyle, DISPLAY_FONT, BODY_FONT } from "../styles/theme";
import { getWatchProviderList } from "../api/tmdb";
import { adaptProviderList } from "../api/adapters";
import RegionSelect from "../components/RegionSelect";
import { useWishlistDetails } from "../hooks/useWishlistDetails";
import { Sheen } from "../components/Primitives";
import { ProviderIcon } from "../components/Cards";

function allProvidersOf(item) {
  const wp = item.watchProviders || {};
  const combined = [...(wp.flatrate || []), ...(wp.rent || []), ...(wp.buy || []), ...(wp.free || []), ...(wp.ads || [])];
  const seen = new Set();
  return combined.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
}

function Card({ C, children }) {
  return (
    <div style={{ flex: "1 1 0px", minWidth: 0, borderRadius: 18, padding: 20, textAlign: "center", ...glassStyle(C), overflow: "visible", position: "relative", }}>
      <Sheen C={C} />
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
}


function IconGrid({ items, C }) {
  if (items.length === 0) return <div style={{ fontFamily: BODY_FONT, fontSize: 12, color: C.muted }}>None yet.</div>;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(64px, 1fr))", gap: 10, marginTop: 12 }}>
      {items.map(({ provider, count }) => (
        <div key={provider.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <ProviderIcon provider={provider} C={C} size={34} />
          <span style={{ fontFamily: BODY_FONT, fontSize: 10, color: C.text, textAlign: "center", lineHeight: 1.2 }}>{provider.name}</span>
          {typeof count === "number" && <span style={{ fontFamily: BODY_FONT, fontSize: 10, fontWeight: 700, color: C.coralSolid }}>{count}</span>}
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage({ C, wishlist, ownedProviderIds, watchRegion, user, userCountry, onManualCountry }) {
  const navigate = useNavigate();
  const [ownedProviderObjs, setOwnedProviderObjs] = useState([]);
  const { items: wishlistItems } = useWishlistDetails(wishlist, watchRegion);

  useEffect(() => {
    if (ownedProviderIds.length === 0) { setOwnedProviderObjs([]); return; }
    getWatchProviderList("movie", watchRegion)
      .then((list) => setOwnedProviderObjs(adaptProviderList(list).filter((p) => ownedProviderIds.includes(p.id))))
      .catch(() => setOwnedProviderObjs([]));
  }, [ownedProviderIds, watchRegion]);

  return (
    <div>
      <h1 style={{ fontFamily: DISPLAY_FONT, fontWeight: 800, fontSize: 24, color: C.text, margin: "0 0 4px 0" }}>
        {user?.name ? `Welcome back, ${user.name}` : "Your Dashboard"}
      </h1>
      <p style={{ fontFamily: BODY_FONT, fontSize: 13, color: C.muted, margin: "0 0 22px 0" }}>A quick look at your account.</p>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 ,}}>
        <Card C={C}>
          <div style={{ fontFamily: DISPLAY_FONT, fontWeight: 800, fontSize: 26, color: C.text }}>{ownedProviderIds.length}</div>
          <div style={{ fontFamily: BODY_FONT, fontSize: 12, color: C.muted, marginTop: 2 }}>Platforms linked</div>
          <IconGrid items={ownedProviderObjs.map((provider) => ({ provider }))} C={C} />
          <button
            onClick={() => navigate("/my-ott")}
            style={{
              marginTop: 14,
              padding: "8px 14px",
              borderRadius: 999,
              border: "none",
              background: C.coral,
              color: C.accentText,
              fontFamily: BODY_FONT,
              fontWeight: 700,
              fontSize: 11,
              cursor: "pointer",
            }}>
            Manage My OTT
        </button>
        </Card>

        <Card C={C}>
  <div style={{ fontFamily: DISPLAY_FONT, fontWeight: 800, fontSize: 26, color: C.text }}>
    {wishlistItems.length}
  </div>

  <div style={{ fontFamily: BODY_FONT, fontSize: 12, color: C.muted, marginTop: 2 }}>
    Wishlisted titles
  </div>

  <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 14 }}>
    {[
      ["Movies", wishlistItems.filter((item) => item.tmdbMediaType === "movie").length],
      ["Series", wishlistItems.filter((item) => item.tmdbMediaType === "tv").length],
      ["Anime", 0],
    ].map(([label, count]) => (
      <div
        key={label}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: BODY_FONT,
          fontSize: 12,
        }}
      >
        <span style={{ color: C.muted }}>{label}</span>
        <span style={{ color: C.text, fontWeight: 700 }}>{count}</span>
      </div>
    ))}
  </div>

  <button
    onClick={() => navigate("/wishlist")}
    style={{
      marginTop: 16,
      padding: "8px 14px",
      borderRadius: 999,
      border: "none",
      background: C.coral,
      color: C.accentText,
      fontFamily: BODY_FONT,
      fontWeight: 700,
      fontSize: 11,
      cursor: "pointer",
    }}
  >
    View Wishlist
  </button>
</Card>
      </div>

      <h2 style={{ fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: 17, color: C.text, margin: "0 0 12px 0" }}>Account</h2>
      <div style={{ borderRadius: 18, padding: 20, marginBottom: 24, ...glassStyle(C), position: "relative", zIndex: 20, overflow: "visible", }}>
        <Sheen C={C} />
        <div style={{ position: "relative", display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center", overflow: "visible", }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.iconBg, border: `1px solid ${C.iconBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY_FONT, fontWeight: 800, fontSize: 20, color: C.text, flexShrink: 0 }}>
            {(user?.name || "?").charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 180, position: "relative", zIndex: 30 ,}}>
            <div style={{ fontFamily: BODY_FONT, fontSize: 12, color: C.muted, marginBottom: 2 }}>Name</div>
            <div style={{ fontFamily: BODY_FONT, fontSize: 14, fontWeight: 600, color: C.text }}>{user?.name || "Not set"}</div>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontFamily: BODY_FONT, fontSize: 12, color: C.muted, marginBottom: 6 }}>Region</div>
            <RegionSelect
              selectedCountryName={userCountry}
              onManualSelect={onManualCountry}
              C={C}
            />
          </div>
          <button onClick={() => navigate("/profile")} style={{ padding: "9px 16px", borderRadius: 999, border: `1px solid ${C.glassBorder}`, background: "transparent", color: C.text, fontFamily: BODY_FONT, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Edit profile
          </button>
        </div>
      </div>

      <h2 style={{ fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: 17, color: C.text, margin: "0 0 10px 0" }}>Quick links</h2>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {[{ label: "Wishlist", to: "/wishlist" }, { label: "My OTT", to: "/my-ott" }, { label: "Settings", to: "/settings" }].map((l) => (
          <button key={l.to} onClick={() => navigate(l.to)} style={{ padding: "9px 16px", borderRadius: 999, border: "none", cursor: "pointer", fontFamily: BODY_FONT, fontSize: 12, fontWeight: 600, color: C.text, ...glassStyle(C) }}>
            <Sheen C={C} /><span style={{ position: "relative" }}>{l.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}