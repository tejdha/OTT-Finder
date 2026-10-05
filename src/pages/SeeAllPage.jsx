import React, { useEffect, useState } from "react";
import { data, useLocation, useNavigate } from "react-router-dom";
import { DISPLAY_FONT } from "../styles/theme";
import { PosterCard } from "../components/Cards";
import {
  getTopRated,
  getGenreMap,
  discover,
} from "../api/tmdb";
import { adaptListResponse } from "../api/adapters";
import { toIsoRegion } from "../api/regions";

// function getWeekStart() {
//   const date = new Date();
//   const day = date.getDay();
//   const diff = day === 0 ? -6 : 1 - day;
//   date.setDate(date.getDate() + diff);
//   return date.toISOString().slice(0, 10);
// }

// function getWeekEnd() {
//   const date = new Date(getWeekStart());
//   date.setDate(date.getDate() + 6);
//   return date.toISOString().slice(0, 10);
// }

function getOttStart() {
  const date = new Date();
  date.setDate(date.getDate() - 59);
  return date.toISOString().slice(0, 10);
}

function getOttEnd() {
  return new Date().toISOString().slice(0, 10);
}

const SOURCE_FETCHERS = {

  // platform page seeall button data

"platform-latest-movies": (page, { providerId, watchRegion }) =>
  discover("movie", {
    providerId,
    watchRegion,
    region: watchRegion,
    watchMonetizationTypes: "flatrate|free|ads",
    releaseDateFrom: getOttStart(),
    releaseDateTo: getOttEnd(),
    withReleaseType: 4,
    sortBy: "release_date.desc",
    page,
  }),

"platform-latest-tv": (page, { providerId, watchRegion }) =>
  discover("tv", {
    providerId,
    watchRegion,
    watchMonetizationTypes: "flatrate|free|ads",
    dateFrom: getOttStart(),
    dateTo: getOttEnd(),
    sortBy: "first_air_date.desc",
    page,
  }),

"platform-top-imdb-movies": (page, { providerId, watchRegion }) =>
  discover("movie", {
    providerId,
    watchRegion,
    sortBy: "vote_average.desc",
    page,
  }),

"platform-top-imdb-tv": (page, { providerId, watchRegion }) =>
  discover("tv", {
    providerId,
    watchRegion,
    sortBy: "vote_average.desc",
    page,
  }),

"platform-most-popular-movies": (page, { providerId, watchRegion }) =>
  discover("movie", {
    providerId,
    watchRegion,
    watchMonetizationTypes: "flatrate|free|ads",
    sortBy: "popularity.desc",
    page,
  }),

"platform-most-popular-tv": (page, { providerId, watchRegion }) =>
  discover("tv", {
    providerId,
    watchRegion,
    watchMonetizationTypes: "flatrate|free|ads",
    sortBy: "popularity.desc",
    page,
  }),

// home page seeall button data

//   "latest-this-week": async (page, { watchRegion }) => {
//   const [movies, tv] = await Promise.all([
//     discover("movie", {
//       region: watchRegion,
//       releaseDateFrom: getWeekStart(),
//       releaseDateTo: getWeekEnd(),
//       withReleaseType: "2|3",
//       sortBy: "primary_release_date.desc",
//       page,
//     }),

//     discover("tv", {
//       region: watchRegion,
//       dateFrom: getWeekStart(),
//       dateTo: getWeekEnd(),
//       sortBy: "first_air_date.desc",
//       page,
//     }),
//   ]);

//   return {
//     results: [
//       ...(movies.results || []).map(item => ({
//         ...item,
//         media_type: "movie",
//       })),
//       ...(tv.results || []).map(item => ({
//         ...item,
//         media_type: "tv",
//       })),
//     ],
//     total_pages: Math.max(
//       movies.total_pages || 1,
//       tv.total_pages || 1
//     ),
//   };
// },

"latest-ott-movies": async (page, { watchRegion }) => 
    discover("movie", {
      watchRegion,
      region: watchRegion,
      watchMonetizationTypes: "flatrate|free|ads",
      releaseDateFrom: getOttStart(),
      releaseDateTo: getOttEnd(),
      withReleaseType: 4,
      sortBy: "release_date.desc",
      page,
    }),

"latest-ott-tv": async (page, {watchRegion}) =>
    discover("tv", {
      watchRegion,
      watchMonetizationTypes: "flatrate|free|ads",
      dateFrom: getOttStart(),
      dateTo: getOttEnd(),
      sortBy: "first_air_date.desc",
      page,
    }),


// "trending-movies": (page) => getTrending("movie", "week", page),
  "trending-movies": (page, { watchRegion }) =>
  discover("movie", {
    watchRegion,
    watchMonetizationTypes: "flatrate|free|ads",
    sortBy: "popularity.desc",
    page,
  }),

"trending-series": (page, { watchRegion }) =>
  discover("tv", {
    watchRegion,
    watchMonetizationTypes: "flatrate|free|ads",
    sortBy: "popularity.desc",
    page,
  }),

  "top-imdb-rated" : (page)=> getTopRated("movie", page),
  "top-imdb-rated-tv": (page)=> getTopRated("tv", page),

  // "most-popular" : (page)=> getPopular("movie", page),
  "most-popular-movies": (page, { watchRegion }) =>
  discover("movie", {
    watchRegion,
    watchMonetizationTypes: "flatrate|free|ads",
    sortBy: "popularity.desc",
    page,
  }),

"most-popular-tv": (page, { watchRegion }) =>
  discover("tv", {
    watchRegion,
    watchMonetizationTypes: "flatrate|free|ads",
    sortBy: "popularity.desc",
    page,
  }),

  "platform": (page, { providerId, watchRegion, activeCat }) => {
    const sortBy =
      activeCat === "latest"
        ? "primary_release_date.desc"
        : activeCat === "trending"
          ? "popularity.desc"
          : "vote_average.desc";
    
    const mediaType =
      activeCat === "series"
        ? "tv"
        : "movie";
    
    return discover(mediaType, {
      providerId,
      watchRegion,
      sortBy,
      page,
    });
  },
   "genre": (page, { genreId, watchRegion, activeCat }) => {
    const mediaType = activeCat === "series" ? "tv" : "movie";
    return discover(mediaType, {
      genreId,
      watchRegion,
      sortBy: "popularity.desc",
      page,
    });
  },
};

export default function SeeAllPage({
  C,
  wishlist,
  onToggleWishlist,
  ownedProviderIds,
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const {
  source = "",
  title = "",
  genreId,
  genreName,
  providerId,
  providerName,
  watchRegion,
  activeCat,
  browsingCountry,
  seeAllPage,
} = location.state || {};

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(seeAllPage || 1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
  navigate(location.pathname, {
    replace: true,
    state: {
      ...location.state,
      seeAllPage: page,
    },
  });
}, [page]);

  useEffect(() => {
  let cancelled = false;

  async function loadData() {
    setLoading(true);

    try {
      const sourceKey = source.trim().toLowerCase();
      const fetcher = SOURCE_FETCHERS[sourceKey];

      if (!fetcher) {
        setItems([]);
        return;
      }

      const response = await fetcher(page, {
        genreId,
        genreName,
        providerId,
        providerName,
        watchRegion,
        activeCat,
      });

      if (!cancelled) {
        setTotalPages(Math.min(response?.total_pages || 1, 500));
      }

      if (!response) {
        setItems([]);
        return;
      }

      const gMap = await getGenreMap();

      const adapted = adaptListResponse(response, gMap).map((m) => ({
        ...m,
        tmdbMediaType: m.tmdbMediaType || m.mediaType || "movie",
        type: m.type || m.mediaType || "movie",
      }));

      if (!cancelled) {
        setItems(adapted);
      }
    } catch {
      if (!cancelled) {
        setItems([]);
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  loadData();

  return () => {
    cancelled = true;
  };
}, [source, page, watchRegion, providerId, ]);

useEffect(() => {
  if (loading) return;

  const savedPosition = sessionStorage.getItem(
    "ott-seeall-scroll-position"
  );

  if (savedPosition !== null) {
    requestAnimationFrame(() => {
      window.scrollTo(0, Number(savedPosition));
      sessionStorage.removeItem("ott-seeall-scroll-position");
    });
  }
}, [loading]);

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        style={{
          background: "none",
          border: "none",
          color: C.muted,
          fontFamily: "'Inter', sans-serif",
          fontSize: 14,
          cursor: "pointer",
          padding: "30px 0 20px 0",
        }}
      >
        &larr; Back
      </button>

      <h2
        style={{
          fontFamily: DISPLAY_FONT,
          fontWeight: 700,
          fontSize: 20,
          color: C.text,
          margin: "0 0 16px 0",
        }}
      >
        {title}
      </h2>

      {loading ? (
        <div style={{ color: C.muted }}>
          Loading...
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(150px, 1fr))",
            gap: 18,
          }}
        >
          {items.map((m) => (
            <PosterCard
              key={`${m.tmdbMediaType}-${m.id}`}
              movie={m}
              C={C}
              wishlisted={wishlist.some(
                (w) =>
                  w.id === m.id &&
                  w.mediaType === m.tmdbMediaType
              )}
              onToggleWishlist={onToggleWishlist}
              ownedProviderIds={ownedProviderIds}
              browsingCountry={browsingCountry}
              seeAllPage={page}
            />
          ))}
        </div>
      )}
      {/* PAGINATION */}
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
        marginTop: 32,
        paddingBottom: 24,
      }}
    >
      <button
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        disabled={page === 1}
        style={{
          padding: "8px 14px",
          borderRadius: 8,
          border: `1px solid ${C.iconBorder}`,
          background: "transparent",
          color: page === 1 ? C.muted : C.text,
          cursor: page === 1 ? "default" : "pointer",
        }}
      >
        Previous
      </button>

      <span
        style={{
          color: C.text,
          fontSize: 14,
        }}
      >
        Page {page} of {totalPages}
      </span>

      <button
        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        disabled={page === totalPages}
        style={{
          padding: "8px 14px",
          borderRadius: 8,
          border: `1px solid ${C.iconBorder}`,
          background: "transparent",
          color: page === totalPages ? C.muted : C.text,
          cursor: page === totalPages ? "default" : "pointer",
        }}
      >
        Next
      </button>
    </div>
    </div>
  );
}                                         
