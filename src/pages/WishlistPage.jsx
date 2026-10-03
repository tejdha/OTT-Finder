import React, { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { DISPLAY_FONT, BODY_FONT } from "../styles/theme";
// import { getCachedItems } from "../api/movieCache";
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
  
  const grouped = {};

movies.forEach((movie) => {
  const providerGroups = [
    ...(movie.watchProviders?.flatrate || []),
    ...(movie.watchProviders?.free || []),
    ...(movie.watchProviders?.ads || []),
    ...(movie.watchProviders?.rent || []),
    ...(movie.watchProviders?.buy || []),
  ];

  const uniqueProviders = Array.from(
    new Map(providerGroups.map((p) => [p.id, p])).values()
  );

  uniqueProviders.forEach((provider) => {
    if (!grouped[provider.id]) {
      grouped[provider.id] = {
        provider,
        movies: [],
        series: [],
      };
    }

    if (movie.tmdbMediaType === "movie") {
      grouped[provider.id].movies.push(movie);
    } else if (movie.tmdbMediaType === "tv") {
      grouped[provider.id].series.push(movie);
    }
  });
});

  if (movies.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "70px 0", fontFamily: BODY_FONT }}>
        <Heart size={26} color={C.muted} style={{ marginBottom: 12 }} />
        <div style={{ color: C.text, fontSize: 16, fontWeight: 700, marginBottom: 6, fontFamily: DISPLAY_FONT }}>Your wishlist is empty</div>
        <div style={{ color: C.muted, fontSize: 13 }}>Tap the heart on a movie to save it here.</div>
      </div>
    );
  }
 return (
  <div>
    <h1
      style={{
        fontFamily: DISPLAY_FONT,
        color: C.text,
        fontSize: 24,
        marginBottom: 28,
      }}
    >
      Wishlist
    </h1>

    {/* Movies */}
    {movies.some((m) => m.tmdbMediaType === "movie") && (
      <section style={{ marginBottom: 40 }}>
        <h2
          style={{
            fontFamily: DISPLAY_FONT,
            color: C.text,
            fontSize: 20,
            marginBottom: 20,
          }}
        >
          Movies
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
            gap: 18,
          }}
        >
          {movies
            .filter((m) => m.tmdbMediaType === "movie")
            .map((m) => (
              <PosterCard
                key={`movie-${m.id}`}
                movie={m}
                C={C}
                wishlisted={true}
                onToggleWishlist={onToggleWishlist}
                ownedProviderIds={ownedProviderIds}
                showProviders={true}
              />
            ))}
        </div>
      </section>
    )}

    {/* Series */}
    {movies.some((m) => m.tmdbMediaType === "tv") && (
      <section>
        <h2
          style={{
            fontFamily: DISPLAY_FONT,
            color: C.text,
            fontSize: 20,
            marginBottom: 20,
          }}
        >
          Series
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
            gap: 18,
          }}
        >
          {movies
            .filter((m) => m.tmdbMediaType === "tv")
            .map((m) => (
              <PosterCard
                key={`tv-${m.id}`}
                movie={m}
                C={C}
                wishlisted={true}
                onToggleWishlist={onToggleWishlist}
                ownedProviderIds={ownedProviderIds}
                showProviders={true}
              />
            ))}
        </div>
      </section>
    )}
  </div>
);
}
