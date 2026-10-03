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

  const [latest, setLatest] = useState([]);
  const [topMovies, setTopMovies] = useState([]);
  const [topSeries, setTopSeries] = useState([]);
  const [topRated, setTopRated] = useState([]);

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

    Promise.all([
      discover("movie", {
        providerId,
        watchRegion: toIsoRegion(platformCountry),
        sortBy: "primary_release_date.desc",
      }),

      discover("movie", {
        providerId,
        watchRegion: toIsoRegion(platformCountry),
        sortBy: "vote_average.desc",
      }),

      discover("tv", {
        providerId,
        watchRegion: toIsoRegion(platformCountry),
        sortBy: "vote_average.desc",
      }),

      getGenreMap(),
    ])
      .then(
        ([
          latestRes,
          topMoviesRes,
          topSeriesRes,
          gMap,
        ]) => {
          if (cancelled) return;

          const l = adaptListResponse(
            latestRes,
            gMap
          ).map((m) => ({
            ...m,
            tmdbMediaType: "movie",
            type: "movie",
          }));

          const tm = adaptListResponse(
            topMoviesRes,
            gMap
          ).map((m) => ({
            ...m,
            tmdbMediaType: "movie",
            type: "movie",
          }));

          const ts = adaptListResponse(
            topSeriesRes,
            gMap
          ).map((m) => ({
            ...m,
            tmdbMediaType: "tv",
            type: "tv",
          }));

          const combinedTopRated = [
            ...tm,
            ...ts,
          ]
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 10);

          registerItems([
            ...l,
            ...tm,
            ...ts,
          ]);

          setLatest(l);
          setTopMovies(tm.slice(0, 10));
          setTopSeries(ts.slice(0, 10));
          setTopRated(combinedTopRated);
        }
      )
      .catch(() => {
        if (cancelled) return;

        setLatest([]);
        setTopMovies([]);
        setTopSeries([]);
        setTopRated([]);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    providerId,
    platformCountry,
    platformAvailable,
  ]);

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
            title="Latest releases"
            items={latest}
            C={C}
            wishlist={wishlist}
            onToggleWishlist={
              onToggleWishlist
            }
            ownedProviderIds={
              ownedProviderIds
            }
            browsingCountry={
              platformCountry
            }
            onSeeAll={() =>
              navigate("/see-all", {
                state: {
                  items: latest,
                  title: `${providerName} — Latest releases`,
                },
              })
            }
          />

          <Row
            title="Top 10 movies"
            items={topMovies}
            C={C}
            wishlist={wishlist}
            onToggleWishlist={
              onToggleWishlist
            }
            ownedProviderIds={
              ownedProviderIds
            }
            browsingCountry={
              platformCountry
            }
            onSeeAll={() =>
              navigate("/see-all", {
                state: {
                  items: topMovies,
                  title: `${providerName} — Top 10 movies`,
                },
              })
            }
          />

          <Row
            title="Top 10 series & TV shows"
            items={topSeries}
            C={C}
            wishlist={wishlist}
            onToggleWishlist={
              onToggleWishlist
            }
            ownedProviderIds={
              ownedProviderIds
            }
            browsingCountry={
              platformCountry
            }
            onSeeAll={() =>
              navigate("/see-all", {
                state: {
                  items: topSeries,
                  title: `${providerName} — Top 10 series & TV shows`,
                },
              })
            }
          />

          <Row
            title="Top rated movies and series"
            items={topRated}
            C={C}
            wishlist={wishlist}
            onToggleWishlist={
              onToggleWishlist
            }
            ownedProviderIds={
              ownedProviderIds
            }
            browsingCountry={
              platformCountry
            }
            onSeeAll={() =>
              navigate("/see-all", {
                state: {
                  items: topRated,
                  title: `${providerName} — Top rated`,
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
            />
          ))}
        </div>
      )}
    </div>
  );
}