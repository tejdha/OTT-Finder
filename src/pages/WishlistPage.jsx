import React, { useState } from "react";
import { Heart } from "lucide-react";
import { DISPLAY_FONT, BODY_FONT } from "../styles/theme";
import { useWishlistDetails } from "../hooks/useWishlistDetails";
import { PosterCard } from "../components/Cards";

export default function WishlistPage({
  C,
  wishlist,
  onToggleWishlist,
  ownedProviderIds,
  watchRegion,
}) {
  const { items: movies, loading } = useWishlistDetails(wishlist, watchRegion);

  const [activeTab, setActiveTab] = useState("movies");

  if (movies.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "70px 0",
          fontFamily: BODY_FONT,
        }}
      >
        <Heart
          size={26}
          color={C.muted}
          style={{ marginBottom: 12 }}
        />

        <div
          style={{
            color: C.text,
            fontSize: 16,
            fontWeight: 700,
            marginBottom: 6,
            fontFamily: DISPLAY_FONT,
          }}
        >
          Your wishlist is empty
        </div>

        <div
          style={{
            color: C.muted,
            fontSize: 13,
          }}
        >
          Tap the heart on a movie to save it here.
        </div>
      </div>
    );
  }

  const movieItems = movies.filter(
    (m) => m.tmdbMediaType === "movie"
  );

  const seriesItems = movies.filter(
    (m) => m.tmdbMediaType === "tv"
  );

  const activeItems =
    activeTab === "movies" ? movieItems : seriesItems;

  return (
    <div>
      {/* Title */}
      <h1
        style={{
          fontFamily: DISPLAY_FONT,
          color: C.text,
          fontSize: 24,
          marginBottom: 20,
        }}
      >
        Wishlist
      </h1>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 20,
          marginBottom: 24,
        }}
      >
        <button
          onClick={() => setActiveTab("movies")}
          style={{
            padding: "10px 16px",
            borderRadius: 9999,
            border: `1px solid ${
              activeTab === "movies"
                ? C.accent
                : C.glassBorder
            }`,
            background:
              activeTab === "movies"
                ? C.glass
                : "transparent",
            color:
              activeTab === "movies"
                ? C.coralSolid
                : C.muted,
            fontFamily: BODY_FONT,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Movies
        </button>

        <button
          onClick={() => setActiveTab("series")}
          style={{
            padding: "10px 16px",
            borderRadius: 999,
            border: `1px solid ${
              activeTab === "series"
                ? C.accent
                : C.glassBorder
            }`,
            background:
              activeTab === "series"
                ? C.glass
                : "transparent",
            color:
              activeTab === "series"
                ? C.coralSolid
                : C.muted,
            fontFamily: BODY_FONT,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Series
        </button>
      </div>

      {/* Active Wishlist Grid */}
      {activeItems.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(110px, 1fr))",
            gap: 18,
          }}
        >
          {activeItems.map((m) => (
            <PosterCard
              key={`${activeTab}-${m.id}`}
              movie={m}
              C={C}
              wishlisted={true}
              onToggleWishlist={onToggleWishlist}
              ownedProviderIds={ownedProviderIds}
              showProviders={true}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "50px 0",
            color: C.muted,
            fontFamily: BODY_FONT,
            fontSize: 13,
          }}
        >
          No {activeTab === "movies" ? "movies" : "series"} in your wishlist.
        </div>
      )}
    </div>
  );
}