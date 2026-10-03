import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { DISPLAY_FONT, BODY_FONT } from "../styles/theme";
import {
  discover,
  getGenreMap,
  getWatchProviderList,
  searchMulti,
  getTitleWatchProviders,
} from "../api/tmdb";
import { toIsoRegion } from "../api/regions";
import { adaptListResponse, adaptProviderList } from "../api/adapters";
import { registerItems } from "../api/movieCache";
import { ProviderIcon, PosterCard } from "../components/Cards";
import { Row, GenreSection } from "../components/Sections";
import {
  SearchBar,
  FilterDropdown,
  SortDropdown,
} from "../components/SearchAndFilters";
import RegionSelect from "../components/RegionSelect";

const RATING_TO_VOTE_AVG = {
  "9+": 9,
  "8+": 8,
  "7+": 7,
  "6+": 6,
};

function getOttStart() {
  const date = new Date();
  date.setDate(date.getDate() - 59);
  return date.toISOString().slice(0, 10);
}

function getOttEnd() {
  return new Date().toISOString().slice(0, 10);
}

export default function PlatformPage({
  C,
  wishlist,
  onToggleWishlist,
  ownedProviderIds,
  watchRegion,
  userCountry,
  onManualCountry,
  homeCountry,
}) {
  const { id } = useParams();
  const providerId = Number(id);

  const navigate = useNavigate();
  const location = useLocation();

  const providerName = location.state?.name || "This platform";

  const [platformCountry, setPlatformCountry] = useState(homeCountry);

  useEffect(() => {
    setPlatformCountry(homeCountry);
  }, [homeCountry]);

  const [query, setQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState([]);
  const [yearFilter, setYearFilter] = useState([]);
  const [ratingFilter, setRatingFilter] = useState([]);
  const [typeFilter, setTypeFilter] = useState([]);
  const [sortOption, setSortOption] = useState("none");

  const TYPE_TO_MEDIA = {
    Movie: "movie",
    "TV Show & Web Series": "tv",
    Anime: "tv",
  };

  const yearOptions = useMemo(() => {
    const now = new Date().getFullYear();
    const startYear = 2000;

    return Array.from(
      { length: now - startYear + 1},
      (_, i) => String(now - i)
    );
  }, []);

  const [genreMap, setGenreMap] = useState({});
  const [genreNameToId, setGenreNameToId] = useState({});

  const [latestMovies, setLatestMovies] = useState([]);
const [latestTV, setLatestTV] = useState([]);

const [trendingMovies, setTrendingMovies] = useState([]);
const [trendingTV, setTrendingTV] = useState([]);

const [topRatedMovies, setTopRatedMovies] = useState([]);
const [topRatedTV, setTopRatedTV] = useState([]);

const [popularMovies, setPopularMovies] = useState([]);
const [popularTV, setPopularTV] = useState([]);



  const [loading, setLoading] = useState(true);
  const [platformAvailable, setPlatformAvailable] = useState(null);

  const toggleGenre = (g) =>
    setGenreFilter((prev) =>
      prev.includes(g)
        ? prev.filter((x) => x !== g)
        : [...prev, g]
    );

  const toggleRating = (r) =>
    setRatingFilter((prev) =>
      prev.includes(r)
        ? prev.filter((x) => x !== r)
        : [...prev, r]
    );

  const toggleType = (t) =>
    setTypeFilter((prev) =>
      prev.includes(t)
        ? prev.filter((x) => x !== t)
        : [...prev, t]
    );

  // ---------------------------------------------------------
  // GENRE MAP
  // ---------------------------------------------------------

  useEffect(() => {
    getGenreMap().then((map) => {
      setGenreMap(map);

      const nameToId = {};

      Object.entries(map).forEach(([gid, name]) => {
        nameToId[name] = Number(gid);
      });

      setGenreNameToId(nameToId);
    });
  }, []);

  // ---------------------------------------------------------
  // CHECK WHETHER PLATFORM EXISTS IN SELECTED COUNTRY
  // ---------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    setPlatformAvailable(null);

    const region = toIsoRegion(platformCountry);

    Promise.all([
      getWatchProviderList("movie", region),
      getWatchProviderList("tv", region),
    ])
      .then(([movieProviders, tvProviders]) => {
        if (cancelled) return;

        const providers = [
          ...adaptProviderList(movieProviders, region),
          ...adaptProviderList(tvProviders, region),
        ];

        const available = providers.some(
          (provider) => Number(provider.id) === providerId
        );

        setPlatformAvailable(available);
      })
      .catch(() => {
        if (!cancelled) {
          setPlatformAvailable(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [providerId, platformCountry]);

  // ---------------------------------------------------------
  // SEARCH + FILTER STATE
  // ---------------------------------------------------------

  const [filterResults, setFilterResults] = useState([]);
  const [filtering, setFiltering] = useState(false);

  const hasSearch = query.trim().length > 0;

  const hasFilters =
    genreFilter.length > 0 ||
    yearFilter.length > 0 ||
    ratingFilter.length > 0 ||
    typeFilter.length > 0 ||
    sortOption !== "none";

  const isFiltering = hasSearch || hasFilters;

  // ---------------------------------------------------------
  // SEARCH
  //
  // Same basic search behavior as HomePage:
  // - one searchMulti() request
  // - 350ms debounce
  //
  // PlatformPage adds:
  // - selected country
  // - selected platform verification
  // ---------------------------------------------------------

  // ---------------------------------------------------------
// SEARCH
//
// Search multiple TMDB pages for partial queries, then
// restrict the results to this platform + selected country.
// ---------------------------------------------------------

useEffect(() => {
  if (!hasSearch) {
    if (!hasFilters) {
      setFilterResults([]);
    }

    return;
  }

  let cancelled = false;

  setFiltering(true);

  const handle = setTimeout(async () => {
    const region = toIsoRegion(platformCountry);

    try {
      // Search multiple pages so partial queries like "spi"
      // can reach titles such as Spider-Man.
      const searchPages = [1, 2, 3, 4, 5];

      const responses = await Promise.all(
        searchPages.map((page) =>
          searchMulti(query.trim(), page)
        )
      );

      if (cancelled) return;

      // Combine all search results.
      const candidates = responses
        .flatMap((res) => res.results || [])
        .filter(
          (item) =>
            (item.media_type === "movie" ||
              item.media_type === "tv") &&
            item.id
        );

      // Remove duplicates across pages.
      const seen = new Set();

      const uniqueCandidates = candidates.filter((item) => {
        const key = `${item.media_type}-${item.id}`;

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      });

      // Check every candidate against the selected
      // platform + selected country.
      const available = await Promise.all(
        uniqueCandidates.map(async (item) => {
          try {
            const providers =
              await getTitleWatchProviders(
                item.media_type,
                item.id
              );

            const countryProviders =
              providers?.results?.[region];

            if (!countryProviders) {
              return null;
            }

            const allProviders = [
              ...(countryProviders.flatrate || []),
              ...(countryProviders.rent || []),
              ...(countryProviders.buy || []),
              ...(countryProviders.free || []),
              ...(countryProviders.ads || []),
            ];

            const belongsToPlatform =
              allProviders.some(
                (provider) =>
                  Number(provider.provider_id) ===
                  providerId
              );

            return belongsToPlatform ? item : null;
          } catch {
            return null;
          }
        })
      );

      if (cancelled) return;

      const validResults =
        available.filter(Boolean);

      const gMap = await getGenreMap();

      const adapted = adaptListResponse(
        { results: validResults },
        gMap
      );

      registerItems(adapted);
      setFilterResults(adapted);
    } catch {
      if (!cancelled) {
        setFilterResults([]);
      }
    } finally {
      if (!cancelled) {
        setFiltering(false);
      }
    }
  }, 350);

  return () => {
    cancelled = true;
    clearTimeout(handle);
  };
}, [
  hasSearch,
  hasFilters,
  query,
  providerId,
  platformCountry,
]);

  // ---------------------------------------------------------
  // NORMAL FILTERS
  //
  // Same HomePage-style filter logic, with:
  // - providerId
  // - platformCountry
  // ---------------------------------------------------------

  const mediaTypes = typeFilter.length
    ? [
        ...new Set(
          typeFilter.map((t) => TYPE_TO_MEDIA[t])
        ),
      ]
    : ["movie", "tv"];

  const getSortBy = (mediaType) => {
    // A-Z / Z-A is handled client-side after fetching.
    if (sortOption === "az" || sortOption === "za") {
      return "popularity.desc";
    }

    if (sortOption === "latest") {
      return mediaType === "tv"
        ? "first_air_date.desc"
        : "primary_release_date.desc";
    }

    if (sortOption === "oldest") {
      return mediaType === "tv"
        ? "first_air_date.asc"
        : "primary_release_date.asc";
    }

    if (sortOption === "toprated") {
      return "vote_average.desc";
    }

    if (sortOption === "popular") {
      return "popularity.desc";
    }

    return "popularity.desc";
  };

  const minRating = ratingFilter.length
    ? Math.min(
        ...ratingFilter.map(
          (r) => RATING_TO_VOTE_AVG[r]
        )
      )
    : undefined;

  const years = yearFilter.length
    ? yearFilter
    : [undefined];

  const pages = [1, 2, 3, 4, 5];

  useEffect(() => {
    // Search takes priority over normal filters.
    if (!hasFilters || hasSearch) {
      if (!hasFilters && !hasSearch) {
        setFilterResults([]);
      }

      return;
    }

    let cancelled = false;

    setFiltering(true);

    const region = toIsoRegion(platformCountry);

    Promise.all(
      mediaTypes.flatMap((mediaType) => {
        const genreMapForMedia = genreNameToId;

        const genreIds = genreFilter
          .map((g) => genreMapForMedia[g])
          .filter(Boolean)
          .join(",");

          const animeGenreId = 16;

        return years.flatMap((year) =>
          pages.map((page) =>
            discover(mediaType, {
              providerId,
              watchRegion: region,
              genreId: typeFilter.includes("Anime")
              ? animeGenreId
              :genreIds || undefined,
              sortBy: getSortBy(mediaType),
              year,
              minRating,
              page,
            }).then((res) => ({
              res,
              mediaType,
            }))
          )
        );
      })
    )
      .then(async (responses) => {
        if (cancelled) return;

        const gMap = await getGenreMap();

        let combined = responses.flatMap(
          ({ res, mediaType }) =>
            adaptListResponse(res, gMap).map((m) => ({
              ...m,
              tmdbMediaType: mediaType,
              type: mediaType,
            }))
        );

        const seen = new Set();

        combined = combined.filter((m) => {
          const key = `${m.tmdbMediaType}-${m.id}`;

          if (seen.has(key)) {
            return false;
          }

          seen.add(key);
          return true;
        });

        // A-Z / Z-A are done locally.
        if (sortOption === "za") {
          combined.sort((a, b) =>
            b.title.localeCompare(a.title)
          );
        } else if (sortOption === "az") {
          combined.sort((a, b) =>
            a.title.localeCompare(b.title)
          );
        }

        registerItems(combined);
        setFilterResults(combined);
      })
      .catch(() => {
        if (!cancelled) {
          setFilterResults([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setFiltering(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    hasFilters,
    hasSearch,
    genreFilter,
    yearFilter,
    ratingFilter,
    typeFilter,
    sortOption,
    providerId,
    platformCountry,
    genreNameToId,
  ]);

  // ---------------------------------------------------------
  // NORMAL PLATFORM ROWS
  // ---------------------------------------------------------

 useEffect(() => {
  let cancelled = false;

  if (platformAvailable !== true) {
    setLoading(platformAvailable === null);

    return () => {
      cancelled = true;
    };
  }

  setLoading(true);

  const region = toIsoRegion(platformCountry);

  Promise.all([
    // Latest OTT movies
    discover("movie", {
      providerId,
      watchRegion: region,
      region,
      watchMonetizationTypes: "flatrate|free|ads",
      releaseDateFrom: getOttStart(),
      releaseDateTo: getOttEnd(),
      withReleaseType: 4,
      sortBy: "release_date.desc",
    }),

    // Latest OTT TV
    discover("tv", {
      providerId,
      watchRegion: region,
      watchMonetizationTypes: "flatrate|free|ads",
      dateFrom: getOttStart(),
      dateTo: getOttEnd(),
      sortBy: "first_air_date.desc",
    }),

    // Trending movies
    discover("movie", {
      providerId,
      watchRegion: region,
      watchMonetizationTypes: "flatrate|free|ads",
      sortBy: "popularity.desc",
    }),

    // Trending TV
    discover("tv", {
      providerId,
      watchRegion: region,
      watchMonetizationTypes: "flatrate|free|ads",
      sortBy: "popularity.desc",
    }),

    // Top IMDb rated movies
    discover("movie", {
      providerId,
      watchRegion: region,
      sortBy: "vote_average.desc",
    }),

    // Top IMDb rated TV
    discover("tv", {
      providerId,
      watchRegion: region,
      sortBy: "vote_average.desc",
    }),

    // Most popular movies
    discover("movie", {
      providerId,
      watchRegion: region,
      watchMonetizationTypes: "flatrate|free|ads",
      sortBy: "popularity.desc",
    }),

    // Most popular TV
    discover("tv", {
      providerId,
      watchRegion: region,
      watchMonetizationTypes: "flatrate|free|ads",
      sortBy: "popularity.desc",
    }),

    getGenreMap(),
  ])
    .then(
      ([
        latestMoviesRes,
        latestTVRes,
        trendingMoviesRes,
        trendingTVRes,
        topRatedMoviesRes,
        topRatedTVRes,
        popularMoviesRes,
        popularTVRes,
        gMap,
      ]) => {
        if (cancelled) return;

        const latestMovies = adaptListResponse(
          latestMoviesRes,
          gMap
        ).map((m) => ({
          ...m,
          tmdbMediaType: "movie",
          type: "movie",
        }));

        const latestTV = adaptListResponse(
          latestTVRes,
          gMap
        ).map((m) => ({
          ...m,
          tmdbMediaType: "tv",
          type: "tv",
        }));

        const trendingMovies = adaptListResponse(
          trendingMoviesRes,
          gMap
        ).map((m) => ({
          ...m,
          tmdbMediaType: "movie",
          type: "movie",
        }));

        const trendingTV = adaptListResponse(
          trendingTVRes,
          gMap
        ).map((m) => ({
          ...m,
          tmdbMediaType: "tv",
          type: "tv",
        }));

        const topRatedMovies = adaptListResponse(
          topRatedMoviesRes,
          gMap
        ).map((m) => ({
          ...m,
          tmdbMediaType: "movie",
          type: "movie",
        }));

        const topRatedTV = adaptListResponse(
          topRatedTVRes,
          gMap
        ).map((m) => ({
          ...m,
          tmdbMediaType: "tv",
          type: "tv",
        }));

        const popularMovies = adaptListResponse(
          popularMoviesRes,
          gMap
        ).map((m) => ({
          ...m,
          tmdbMediaType: "movie",
          type: "movie",
        }));

        const popularTV = adaptListResponse(
          popularTVRes,
          gMap
        ).map((m) => ({
          ...m,
          tmdbMediaType: "tv",
          type: "tv",
        }));

        registerItems([
          ...latestMovies,
          ...latestTV,
          ...trendingMovies,
          ...trendingTV,
          ...topRatedMovies,
          ...topRatedTV,
          ...popularMovies,
          ...popularTV,
        ]);

        setLatestMovies(latestMovies);
        setLatestTV(latestTV);

        setTrendingMovies(trendingMovies.slice(0, 10));
        setTrendingTV(trendingTV.slice(0, 10));

        setTopRatedMovies(topRatedMovies.slice(0, 20));
        setTopRatedTV(topRatedTV.slice(0, 20));

        setPopularMovies(popularMovies.slice(0, 20));
        setPopularTV(popularTV.slice(0, 20));
      }
    )
    .catch(() => {
      if (cancelled) return;

      setLatestMovies([]);
      setLatestTV([]);
      setTrendingMovies([]);
      setTrendingTV([]);
      setTopRatedMovies([]);
      setTopRatedTV([]);
      setPopularMovies([]);
      setPopularTV([]);
    })
    .finally(() => {
      if (!cancelled) {
        setLoading(false);
      }
    });

  return () => {
    cancelled = true;
  };
}, [providerId, platformCountry, platformAvailable]);

  const wishlistCheck = (m) =>
    wishlist.some(
      (w) =>
        w.id === m.id &&
        w.mediaType === m.tmdbMediaType
    );

  const genreEntries = Object.entries(
    genreMap
  ).filter(([, name]) => name);

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        style={{
          background: "none",
          border: "none",
          color: C.muted,
          fontFamily: BODY_FONT,
          fontSize: 14,
          cursor: "pointer",
          padding: "0 0 16px 0",
        }}
      >
        &larr; Back
      </button>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 22,
        }}
      >
        <ProviderIcon
          provider={{
            id: providerId,
            name: providerName,
          }}
          C={C}
          size={44}
        />

        <h1
          style={{
            fontFamily: DISPLAY_FONT,
            fontWeight: 800,
            fontSize: 24,
            color: C.text,
            margin: 0,
          }}
        >
          {providerName}
        </h1>
      </div>

      <div
        style={{
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        <SearchBar
          value={query}
          onChange={setQuery}
          C={C}
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          justifyContent: "center",
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <RegionSelect
          selectedCountryName={platformCountry}
          onManualSelect={setPlatformCountry}
          C={C}
        />

        <FilterDropdown
          label="Genre"
          options={Object.values(genreMap)}
          selected={genreFilter}
          onToggle={toggleGenre}
          C={C}
        />

        <FilterDropdown
          label="Year"
          options={yearOptions}
          selected={yearFilter}
          onToggle={(year) =>
            setYearFilter((prev) =>
              prev.includes(year)
                ? prev.filter((x) => x !== year)
                : [...prev, year]
            )
          }
          C={C}
        />

        <FilterDropdown
          label="Rating"
          options={[
            "9+",
            "8+",
            "7+",
            "6+",
          ]}
          selected={ratingFilter}
          onToggle={toggleRating}
          C={C}
        />

        <FilterDropdown
          label="Type"
          options={[
            "Movie",
            "TV Show & Web Series",
            "Anime",
          ]}
          selected={typeFilter}
          onToggle={toggleType}
          C={C}
        />

        <SortDropdown
          value={sortOption}
          onChange={setSortOption}
          C={C}
        />
      </div>

      {platformAvailable === null ? (
        <div
          style={{
            textAlign: "center",
            color: C.muted,
            padding: "60px 0",
          }}
        >
          Checking {providerName} availability in{" "}
          {platformCountry}...
        </div>
      ) : platformAvailable === false ? (
        <div
          style={{
            textAlign: "center",
            padding: "70px 20px",
          }}
        >
          <div
            style={{
              fontFamily: DISPLAY_FONT,
              fontWeight: 800,
              fontSize: 22,
              color: C.text,
              marginBottom: 10,
            }}
          >
            {providerName} isn't available in{" "}
            {platformCountry}
          </div>

          <div
            style={{
              fontFamily: BODY_FONT,
              fontSize: 13,
              color: C.muted,
            }}
          >
            Change the country above to see this
            platform's available catalog.
          </div>
        </div>
      ) : isFiltering ? (
        filtering ? (
          <div
            style={{
              textAlign: "center",
              color: C.muted,
              padding: "50px 0",
            }}
          >
            Loading...
          </div>
        ) : filterResults.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: C.muted,
              padding: "50px 0",
            }}
          >
            No titles found on {providerName} matching
            that.
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
            {filterResults.map((m) => (
              <PosterCard
                key={`${m.tmdbMediaType}-${m.id}`}
                movie={m}
                C={C}
                wishlisted={wishlistCheck(m)}
                onToggleWishlist={
                  onToggleWishlist
                }
                ownedProviderIds={
                  ownedProviderIds
                }
                browsingCountry={
                  platformCountry
                }
              />
            ))}
          </div>
        )
      ) : loading ? (
        <div
          style={{
            textAlign: "center",
            color: C.muted,
            padding: "50px 0",
          }}
        >
          Loading...
        </div>
      ) : (
        <div>
          <Row
            title="Latest Movies"
            items={latestMovies}
            loading={loading}
            C={C}
            wishlist={wishlist}
            onToggleWishlist={onToggleWishlist}
            ownedProviderIds={ownedProviderIds}
            browsingCountry={platformCountry}
            onSeeAll={() =>
              navigate("/see-all", {
              state: {
                source: "platform-latest-movies",
                title: `${providerName} — Latest Movie on OTT`,
                providerId,
                providerName,
                watchRegion: toIsoRegion(platformCountry),
                browsingCountry: platformCountry,
              },
            })
            }
          />

          <Row
            title="Latest TV shows & Web series"
            items={latestTV}
            loading={loading}
            C={C}
            wishlist={wishlist}
            onToggleWishlist={onToggleWishlist}
            ownedProviderIds={ownedProviderIds}
            browsingCountry={platformCountry}
            onSeeAll={() =>
              navigate("/see-all", {
                state: {
                  source: "platform-latest-tv",
                  title: `${providerName} — Latest TV shows on OTT`,
                  providerId,
                  providerName,
                  watchRegion: toIsoRegion(platformCountry),
                  browsingCountry: platformCountry,
                },
              })
            }
          />

          <Row
            title="TOP 10 Trending movies this week"
            items={trendingMovies}
            loading={loading}
            C={C}
            wishlist={wishlist}
            onToggleWishlist={onToggleWishlist}
            ownedProviderIds={ownedProviderIds}
            browsingCountry={platformCountry}
          />

          <Row
            title="TOP 10 Trending TV shows & series this week"
            items={trendingTV}
            loading={loading}
            C={C}
            wishlist={wishlist}
            onToggleWishlist={onToggleWishlist}
            ownedProviderIds={ownedProviderIds}
            browsingCountry={platformCountry}
          />

          <Row
            title="Top TMDb rated movies"
            items={topRatedMovies}
            loading={loading}
            C={C}
            wishlist={wishlist}
            onToggleWishlist={onToggleWishlist}
            ownedProviderIds={ownedProviderIds}
            browsingCountry={platformCountry}
            onSeeAll={() =>
              navigate("/see-all", {
                state: {
                  source: "platform-top-imdb-movies",
                  title: `${providerName} — Top TMDb rated movies`,
                  providerId,
                  providerName,
                  watchRegion: toIsoRegion(platformCountry),
                  browsingCountry: platformCountry,
                },
              })
            }
          />

          <Row
            title="Top TMDb Rated TV shows & series"
            items={topRatedTV}
            loading={loading}
            C={C}
            wishlist={wishlist}
            onToggleWishlist={onToggleWishlist}
            ownedProviderIds={ownedProviderIds}
            browsingCountry={platformCountry}
            onSeeAll={() =>
              navigate("/see-all", {
                state: {
                  source: "platform-top-imdb-tv",
                  title: `${providerName} — Top TMDb Rated TV shows & series`,
                  providerId,
                  providerName,
                  watchRegion: toIsoRegion(platformCountry),
                  browsingCountry: platformCountry,
                },
              })
            }
          />

          <Row
            title="Most Popular TV Shows & Series"
            items={popularTV}
            loading={loading}
            C={C}
            wishlist={wishlist}
            onToggleWishlist={onToggleWishlist}
            ownedProviderIds={ownedProviderIds}
            browsingCountry={platformCountry}
            onSeeAll={() =>
              navigate("/see-all", {
                state: {
                  source: "platform-most-popular-tv",
                  title: `${providerName} — Most Popular TV Shows & Series`,
                  providerId,
                  providerName,
                  watchRegion: toIsoRegion(platformCountry),
                  browsingCountry: platformCountry,
                },
              })
            }
          />

          <Row
            title="Most Popular Movies"
            items={popularMovies}
            loading={loading}
            C={C}
            wishlist={wishlist}
            onToggleWishlist={onToggleWishlist}
            ownedProviderIds={ownedProviderIds}
            browsingCountry={platformCountry}
            onSeeAll={() =>
              navigate("/see-all", {
                state: {
                  source: "platform-most-popular-movies",
                  title: `${providerName} — Most Popular Movies`,
                  providerId,
                  providerName,
                  watchRegion: toIsoRegion(platformCountry),
                  browsingCountry: platformCountry,
                },
              })
            }
          />

          {genreEntries.map(([gid, name]) => (
            <GenreSection
              key={gid}
              genreId={Number(gid)}
              genreName={name}
              providerId={providerId}
              watchRegion={toIsoRegion(
                platformCountry
              )}
              C={C}
              wishlist={wishlist}
              onToggleWishlist={
                onToggleWishlist
              }
              ownedProviderIds={
                ownedProviderIds
              }
              onSeeAll={(genreId, genreName, activeCat) =>
                navigate("/see-all", {
                  state: {
                    source: "genre",
                    genreId,
                    genreName,
                    activeCat,
                    providerId,
                    providerName,
                    watchRegion: toIsoRegion(platformCountry),
                    browsingCountry: platformCountry,
                    title: `${providerName} — ${genreName}`,
                  },
                })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}