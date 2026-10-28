import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

import {
  discover,
  getGenreMap,
  getNowPlaying,
  getTrending,
  getTopRated,
  getWatchProviderList,
  searchMulti,
  getCountryTrending,
  getRecommendations,

} from "../api/tmdb";

import {
  adaptListResponse,
  adaptProviderList,
} from "../api/adapters";

import { registerItems } from "../api/movieCache";

import {
  SearchBar,
  FilterDropdown,
  SortDropdown,
} from "../components/SearchAndFilters";

import { PosterCard } from "../components/Cards";

import {
  Row,
  PlatformSection,
} from "../components/Sections";

import TrendingCarousel from "../components/TrendingCarousel";
import PlatformLogosRow from "../components/PlatformLogosRow";

import { X } from "lucide-react";

import { ALL_COUNTRIES } from "../data/movies";
import RegionSelect from "../components/RegionSelect";

import { toIsoRegion } from "../api/regions";


const RATING_TO_VOTE_AVG = {
  "9+": 9,
  "8+": 8,
  "7+": 7,
  "6+": 6,
};

const TYPE_TO_MEDIA = {
  Movie: "movie",
  "TV Show & Web Series": "tv",
  Anime: "tv",
};

function getWeekStart() {
  const date = new Date();
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  date.setDate(date.getDate() + diff);

  return date.toISOString().slice(0, 10);
}

function getWeekEnd() {
  const date = new Date(getWeekStart());
  date.setDate(date.getDate() + 6);

  return date.toISOString().slice(0, 10);
}

function getOttStart() {
  const date = new Date();
  date.setDate(date.getDate() - 59);
  return date.toISOString().slice(0, 10);
}

function getOttEnd() {
  return new Date().toISOString().slice(0, 10);
}

export default function HomePage({
  C,
  wishlist,
  onToggleWishlist,
  ownedProviderIds,
  userCountry,
  homeCountry,
  onHomeCountryChange,
  watchRegion,
  query,
  onQueryChange,
  platformTabs,
  setPlatformTabs,
}) {
  const navigate = useNavigate();

  // --------------------------------------------------
  // FILTER STATE
  // --------------------------------------------------

const getSavedFilterState = (key, fallback) => {
  try {
    const saved = sessionStorage.getItem("ott-filter-state");
    if (!saved) return fallback;

    const parsed = JSON.parse(saved);
    return parsed[key] ?? fallback;
  } catch {
    return fallback;
  }
};

const [genreFilter, setGenreFilter] = useState(
  () => getSavedFilterState("genreFilter", [])
);

const [yearFilter, setYearFilter] = useState(
  () => getSavedFilterState("yearFilter", [])
);

const [ratingFilter, setRatingFilter] = useState(
  () => getSavedFilterState("ratingFilter", [])
);

const [typeFilter, setTypeFilter] = useState(
  () => getSavedFilterState("typeFilter", [])
);

const [sortOption, setSortOption] = useState(
  () => getSavedFilterState("sortOption", "none")
);

useEffect(() => {
  sessionStorage.setItem(
    "ott-filter-state",
    JSON.stringify({
      genreFilter,
      yearFilter,
      ratingFilter,
      typeFilter,
      sortOption,
    })
  );
}, [
  genreFilter,
  yearFilter,
  ratingFilter,
  typeFilter,
  sortOption,
]);



  // --------------------------------------------------
  // GENERAL DATA
  // --------------------------------------------------

  const [genreMap, setGenreMap] = useState({});
  const [genreNameToId, setGenreNameToId] = useState({});
  const [movieGenreNameToId, setMovieGenreNameToId] = useState({});
  const [tvGenreNameToId, setTvGenreNameToId] = useState({});
  const [genreFilterOptions, setGenreFilterOptions] = useState([]);

  const [topProviders, setTopProviders] = useState([]);

  // --------------------------------------------------
  // SEARCH
  // --------------------------------------------------

  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // --------------------------------------------------
  // HOME ROW DATA
  // --------------------------------------------------

  const [carouselItems, setCarouselItems] = useState([]);
  const [latestOttThisWeek, setLatestOttThisWeek] = useState([]);
  const [latestOttTvThisWeek, setLatestOttTvThisWeek] = useState([]);
  const [topTrendingMovies, setTopTrendingMovies] = useState([]);
  const [topTrendingSeries, setTopTrendingSeries] = useState([]);
  const [topImdbRated, setTopImdbRated] = useState([]);
  const [topImdbRatedTv, setTopImdbRatedTv] = useState([]);

  const [mostPopularMovies, setMostPopularMovies] = useState([]);
  const [mostPopularTv, setMostPopularTv ] = useState([]);
  const [rowsLoading, setRowsLoading] = useState(true);

  // --------------------------------------------------
  // SEARCH PANEL POSITION
  // --------------------------------------------------

  const searchSectionRef = useRef(null);
  const [searchPanelTop, setSearchPanelTop] = useState(0);
  const [searchControlsHidden, setSearchControlsHidden] = useState(false);

  // --------------------------------------------------
  // FILTER TOGGLES
  // --------------------------------------------------

  const toggleGenre = (g) => {
    onQueryChange("");

    setGenreFilter((prev) =>
      prev.includes(g)
        ? prev.filter((x) => x !== g)
        : [...prev, g]
    );
  };

  const toggleYear = (y) => {
    onQueryChange("");

    setYearFilter((prev) =>
      prev.includes(y)
        ? prev.filter((x) => x !== y)
        : [...prev, y]
    );
  };

  const toggleRating = (r) => {
    onQueryChange("");

    setRatingFilter((prev) =>
      prev.includes(r)
        ? prev.filter((x) => x !== r)
        : [...prev, r]
    );
  };

  const toggleType = (t) => {
    onQueryChange("");

    setTypeFilter((prev) =>
      prev.includes(t)
        ? prev.filter((x) => x !== t)
        : [...prev, t]
    );
  };

  // --------------------------------------------------
  // FILTER OPTIONS
  // --------------------------------------------------

  const yearOptions = useMemo(() => {
    const now = new Date().getFullYear();
    const startYear = 2000;

    return Array.from(
      { length: now - startYear + 1 },
      (_, i) => String(now - i)
    );
  }, []);

  const ratingBuckets = ["9+", "8+", "7+", "6+"];

  const typeOptions = [
    "Movie",
    "TV Show & Web Series",
    "Anime",
  ];

  const EXCLUDED_GENRES = new Set([
  "News",
  "Soap",
  "Reality",
  "Talk",
]);
  

  // --------------------------------------------------
  // GENRE MAP + PROVIDERS
  // --------------------------------------------------

  useEffect(() => {
  Promise.all([
    getGenreMap("movie"),
    getGenreMap("tv"),
  ]).then(([movieMap, tvMap]) => {
    const movieNameToId = {};
    const tvNameToId = {};

    Object.entries(movieMap).forEach(([id, name]) => {
      movieNameToId[name] = Number(id);
    });

    Object.entries(tvMap).forEach(([id, name]) => {
      tvNameToId[name] = Number(id);
    });

    setMovieGenreNameToId(movieNameToId);
    setTvGenreNameToId(tvNameToId);

    // Keep the existing genre map available.
    setGenreMap(movieMap);

    // Combined genre names for the filter UI.
    setGenreFilterOptions(
  [...new Set([
    ...Object.values(movieMap),
    ...Object.values(tvMap),
  ])].filter(
    (name) => name && !EXCLUDED_GENRES.has(name)
  )
);
  });

  getWatchProviderList("movie", toIsoRegion(homeCountry))
    .then((list) =>
      setTopProviders(
        adaptProviderList(list).slice(0, 6)
      )
    )
    .catch(() => setTopProviders([]));
}, [homeCountry]);

  // --------------------------------------------------
  // HOME ROWS
  // --------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    setRowsLoading(true);

    Promise.all([

      getCountryTrending("movie",toIsoRegion(homeCountry), "week"),

      getCountryTrending("tv", toIsoRegion(homeCountry),"week"),
      getTrending("movie", "day"),
      
      
      // latest releases row
      // discover("movie",{
      //   region: toIsoRegion(homeCountry),
      //   releaseDateFrom : getWeekStart(),
      //   releaseDateTo: getWeekEnd(),
      //   withReleaseType: "2|3",
      //   sortBy: "primary_release_date.desc",
      // }),

      // discover("tv",{
      //   region: toIsoRegion(homeCountry),
      //   dateFrom: getWeekStart(),
      //   dateTo: getWeekEnd(),
      //   sortBy: "first_air_date.desc",
      // }),
      
      
      // latest ott releases movies
      discover("movie", {
        watchRegion: toIsoRegion(homeCountry),
        region: toIsoRegion(homeCountry),
        watchMonetizationTypes: "flatrate|free|ads",
        releaseDateFrom: getOttStart(),
        releaseDateTo: getOttEnd(),
        withReleaseType: 4,
        sortBy: "release_date.desc",
      }),

      // latest ott releases tv shows / series
      discover("tv", {
        watchRegion: toIsoRegion(homeCountry),
        watchMonetizationTypes: "flatrate|free|ads",
        dateFrom: getOttStart(),
        dateTo: getOttEnd(),
        sortBy: "first_air_date.desc",
      }),

      // most popular movies this week
      discover("movie",{
        watchRegion: toIsoRegion(homeCountry),
        watchMonetizationTypes: "flatrate|free|ads",
        sortBy: "popularity.desc",
      }),

      // most popular tv shows this week
      discover("tv",{
        watchRegion: toIsoRegion(homeCountry),
        watchMonetizationTypes: "flatrate|free|ads",
        sortBy: "popularity.desc",
      }),

      getTopRated("movie",1),
      getTopRated("tv",1),
      getGenreMap(),
    ])
      .then(
        async([
          trendMovies,
          trendTv,
          carouselTrending,
          latestOttMovies,
          latestOttTv,
          popularMovies,
          popularTv,
          topRated,
          topRatedTv,          
          gMap,
        ]) => {

          if (cancelled) return;

          const tm = adaptListResponse(
            trendMovies,
            gMap
          ).map((m) => ({
            ...m,
            tmdbMediaType: "movie",
            type: "movie",
          }));
          
          const tt = adaptListResponse(
            trendTv,
            gMap
          ).map((m) => ({
            ...m,
            tmdbMediaType: "tv",
            type: "tv",
          }));

          const np = adaptListResponse(
            carouselTrending,
            gMap
          ).map((m) => ({
            ...m,
            tmdbMediaType: "movie",
            type: "movie",
          }));


          const lom = adaptListResponse(
            latestOttMovies,
            gMap
          ).map((m) => ({
            ...m,
            tmdbMediaType: "movie",
            type: "movie",
          }));

          const lot = adaptListResponse(
            latestOttTv,
            gMap
          ).map((m) => ({
            ...m,
            tmdbMediaType: "tv",
            type: "tv",
          }));

          const latestOttMoviesSorted = [...lom].sort((a, b) => {
            const dateA = a.releaseDate || "";
            const dateB = b.releaseDate || "";
            return dateB.localeCompare(dateA);
          });

          const latestOttTvSorted = [...lot].sort((a, b) => {
            const dateA = a.releaseDate || "";
            const dateB = b.releaseDate || "";
            return dateB.localeCompare(dateA);
          });

          const tr = adaptListResponse(
            topRated,
            gMap
          ).map((m) => ({
            ...m,
            tmdbMediaType: "movie",
            type: "movie",
          }));

          const trTv = adaptListResponse(
            topRatedTv,
            gMap
          ).map((m)=>({
            ...m,
            tmdbMediaType: "tv",
            type: "tv",
          }));

          const popMovies = adaptListResponse(
              popularMovies,
              gMap
            ).map((m) => ({
              ...m,
              tmdbMediaType: "movie",
              type: "movie",
            }));

          const popTv = adaptListResponse(
            popularTv,
            gMap
          ).map((m) => ({
            ...m,
            tmdbMediaType: "tv",
            type: "tv",
          }));

          registerItems([
            ...tm,
            ...tt,
            ...np,
            ...lom,
            ...lot,
            ...tr,
            ...trTv,
            ...popTv,
            ...popMovies,
          ]);

          setTopTrendingMovies(tm.slice(0, 10));
          setTopTrendingSeries(tt.slice(0, 10));

          setLatestOttThisWeek(latestOttMoviesSorted);
          setLatestOttTvThisWeek(latestOttTvSorted);
          
          setCarouselItems(np.slice(0, 10));
         
          setTopImdbRated(tr.slice(0, 20));
          setTopImdbRatedTv(trTv.slice(0,20));


          setMostPopularMovies(popMovies.slice(0,20));
          setMostPopularTv(popTv.slice(0,20));
        
        }
      )
      .catch((error) => {console.error("HOME ROWS ERROR : ", error)})
      .finally(() => {
        if (!cancelled) {
          setRowsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [homeCountry]);

  // --------------------------------------------------
  // SEARCH
  // --------------------------------------------------

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    let cancelled = false;

    setSearching(true);

    const handle = setTimeout(() => {
      Promise.all([
        searchMulti(query),
        getGenreMap(),
      ])
        .then(([res, gMap]) => {
          if (cancelled) return;

          const adapted = adaptListResponse(
            res,
            gMap
          );

          registerItems(adapted);
          setSearchResults(adapted);
        })
        .catch(() => {
          if (!cancelled) {
            setSearchResults([]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setSearching(false);
          }
        });
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query]);

  // --------------------------------------------------
  // FILTER RESULTS
  // --------------------------------------------------

  const [filterResults, setFilterResults] = useState([]);
  const [filtering, setFiltering] = useState(false);

useEffect(() => {
  const savedScroll = sessionStorage.getItem(
    "ott-home-scroll-position"
  );

  if (savedScroll === null) return;

  const restoreScroll = () => {
    const resultsPanel = document.getElementById(
      "home-results-panel"
    );

    if (!resultsPanel) return;

    resultsPanel.scrollTop = Number(savedScroll);

    sessionStorage.removeItem(
      "ott-home-scroll-position"
    );
  };

  const timer = setTimeout(restoreScroll, 100);

  return () => clearTimeout(timer);
}, [filterResults]);

  const hasActiveFilters =
    genreFilter.length > 0 ||
    yearFilter.length > 0 ||
    ratingFilter.length > 0 ||
    typeFilter.length > 0 ||
    sortOption !== "none";

  useEffect(() => {
    if (!hasActiveFilters || query.trim()) {
      return;
    }

    let cancelled = false;

    setFiltering(true);

    const mediaTypes = typeFilter.length
      ? [
          ...new Set(
            typeFilter.map(
              (t) => TYPE_TO_MEDIA[t]
            )
          ),
        ]
      : ["movie", "tv"];

    const getSortBy = (mediaType) => {
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

    const pages = [1,2,3,4,5]

    Promise.all(
  mediaTypes.flatMap((mediaType) => {

    const genreMapForMedia =
      mediaType === "tv"
        ? tvGenreNameToId
        : movieGenreNameToId;

    const genreIdsArray = genreFilter.map(
  (g) => genreMapForMedia[g]
);

// If a selected genre doesn't exist for this media type,
// don't request that media type at all.
if (
  genreFilter.length > 0 &&
  genreIdsArray.some((id) => !id)
) {
  return [];
}

const genreIds = genreIdsArray.join(",");
  const animeGenreId = tvGenreNameToId["Animation"];

    return years.flatMap((year) =>
      pages.map((page) =>
        
        discover(mediaType, {
          watchRegion: toIsoRegion(homeCountry),
          watchMonetizationTypes: "flatrate|free|ads",
          genreId: typeFilter.includes("Anime") 
          ? animeGenreId
          : genreIds || undefined,
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
            adaptListResponse(
              res,
              gMap
            ).map((m) => ({
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
    hasActiveFilters,
    genreFilter,
    yearFilter,
    ratingFilter,
    typeFilter,
    sortOption,
    movieGenreNameToId,
    tvGenreNameToId,
    query,
    homeCountry,
  ]);

  // --------------------------------------------------
  // MODES
  // --------------------------------------------------

  const isSearchMode = query.trim().length > 0;

  const isFilterMode =
    !isSearchMode && hasActiveFilters;

  // --------------------------------------------------
  // HELPERS
  // --------------------------------------------------

  const wishlistCheck = (m) =>
    wishlist.some(
      (w) =>
        w.id === m.id &&
        w.mediaType === m.tmdbMediaType
    );


  // --------------------------------------------------
  // SEARCH PANEL POSITION
  // --------------------------------------------------

 useEffect(() => {
  const updateSearchPanelPosition = () => {
    if (!searchSectionRef.current) return;

    const rect =
      searchSectionRef.current.getBoundingClientRect();

    const normalTop = rect.bottom + 20;

    setSearchPanelTop(normalTop);

    setSearchControlsHidden((prev) => {
      // Hide only after going clearly above the tab boundary.
      if (!prev && rect.bottom <= 100) {
        return true;
      }

      // Don't show again until we've clearly moved back below it.
      if (prev && rect.bottom >= 125) {
        return false;
      }

      return prev;
    });
  };

  updateSearchPanelPosition();

  window.addEventListener(
    "scroll",
    updateSearchPanelPosition,
    { passive: true }
  );

  window.addEventListener(
    "resize",
    updateSearchPanelPosition
  );

  return () => {
    window.removeEventListener(
      "scroll",
      updateSearchPanelPosition
    );

    window.removeEventListener(
      "resize",
      updateSearchPanelPosition
    );
  };
}, []);
  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div>
      {/* --------------------------------------------- */}
      {/* SEARCH + FILTERS */}
      {/* --------------------------------------------- */}

      <div
        id="home-search-section"
        ref={searchSectionRef}
        style={{
          position: "relative",
          zIndex: 100,
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          <p
            style={{
              color: C.muted,
              fontSize: 13,
              margin: "0 0 20px",
            }}
          >
            Search a movie. Find out exactly where
            to stream, rent, or buy it.
          </p>

          <SearchBar
            value={query}
            onChange={(value) => {
              if (value.trim()) {
                setGenreFilter([]);
                setYearFilter([]);
                setRatingFilter([]);
                setTypeFilter([]);
                setSortOption("none");
              }

              onQueryChange(value);
            }}
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
            selectedCountryName={homeCountry}
            onManualSelect={(country) => {
              onHomeCountryChange(country);
            }}
            C={C}
          />

          <FilterDropdown
            label="Genre"
            options={genreFilterOptions}
            selected={genreFilter}
            onToggle={toggleGenre}
            C={C}
          />

          <FilterDropdown
            label="Year"
            options={yearOptions}
            selected={yearFilter}
            onToggle={toggleYear}
            C={C}
          />

          <FilterDropdown
            label="Rating"
            options={ratingBuckets}
            selected={ratingFilter}
            onToggle={toggleRating}
            C={C}
          />

          <FilterDropdown
            label="Type"
            options={typeOptions}
            selected={typeFilter}
            onToggle={toggleType}
            C={C}
          />
          

          <SortDropdown
            value={sortOption}
            onChange={(value) => {
              onQueryChange("");
              setSortOption(value);
            }}
            C={C}
          />
        </div>
      </div>

      {/* --------------------------------------------- */}
      {/* SEARCH / FILTER RESULTS PANEL */}
      {/* --------------------------------------------- */}

      {(isSearchMode || isFilterMode) && (
        <div
        id="home-results-panel"
          style={{
            position: "fixed",
            top: 
            isSearchMode && searchControlsHidden 
            ? 145 
            : searchPanelTop,

            transition: 
            isSearchMode && searchControlsHidden 
            ? "top 0.22s ease-out"
            : "none",
            left: 24,
            right: 24,
            bottom: 24,
            zIndex: 90,

            overflowY: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",

            padding: "18px 18px 28px",

            background:
              "rgba(10, 10, 14, 0.42)",
            backdropFilter: "blur(5px)",
            WebkitBackdropFilter:
              "blur(14px)",

            border:
              "1px solid rgba(255,255,255,0.08)",
            borderRadius: 18,

            boxSizing: "border-box",
          }}
        >
          
          <button
           onClick={() => {
              onQueryChange("");
              setGenreFilter([]);
              setYearFilter([]);
              setRatingFilter([]);
              setTypeFilter([]);
              setSortOption("none");
            }}
            aria-label="Close results"
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              zIndex: 2,
              width: 34,
              height: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border:
                "1px solid rgba(255,255,255,0.10)",
              borderRadius: "50%",
              background:
                "rgba(10,10,14,0.55)",
              color: C.text,
              cursor: "pointer",
            }}
          >
            <X size={17} />
          </button>
            <div
              id="home-results-scroll"
              style={{
                position: "absolute",
                top: 20,
                left: 0,
                right: 0,
                bottom: 20,
                overflowY: "auto",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >

          {/* SEARCH RESULTS */}

          {isSearchMode ? (
            searching ? (
              <div
                style={{
                  textAlign: "center",
                  color: C.muted,
                  padding: "50px 0",
                }}
              >
                Searching...
              </div>
            ) : searchResults.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: C.muted,
                  padding: "50px 0",
                }}
              >
                No results for "{query}"
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(120px, 1fr))",
                  gap: 18,
                  maxWidth: "95%",
                  margin: "0 auto",
                }}
              >
                {searchResults.map((m) => (
                  <PosterCard
                    key={`${m.tmdbMediaType}-${m.id}`}
                    movie={m}
                    C={C}
                    wishlisted={wishlistCheck(m)}
                    onToggleWishlist={onToggleWishlist}
                    ownedProviderIds={ownedProviderIds}
                    browsingCountry={homeCountry}
                  />
                ))}
              </div>
            )
          ) : /* FILTER RESULTS */

          filtering ? (
            <div
              style={{
                textAlign: "center",
                color: C.muted,
                padding: "50px 0",
              }}
            >
              Filtering...
            </div>
          ) : filterResults.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                color: C.muted,
                padding: "50px 0",
              }}
            >
              No titles match those filters.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(120px, 1fr))",
                gap: 18,
                maxWidth: "95%",
                margin: "0 auto",
              }}
            >
              {filterResults.map((m) => (
                <PosterCard
                  key={`${m.tmdbMediaType}-${m.id}`}
                  movie={m}
                  C={C}
                  wishlisted={wishlistCheck(m)}
                  onToggleWishlist={onToggleWishlist}
                  ownedProviderIds={ownedProviderIds}
                  browsingCountry={homeCountry}
                />
              ))}
            </div>
          )}
        </div>
        </div>
      )}

      {/* --------------------------------------------- */}
      {/* NORMAL HOME CONTENT */}
      {/* --------------------------------------------- */}

      <div>
        <TrendingCarousel
          movies={carouselItems}
          C={C}
        />

        <PlatformLogosRow
          C={C}
          watchRegion={toIsoRegion(homeCountry)}
          ownedProviderIds={ownedProviderIds}
        />
        
        {/* soon on ott row */}
        {/* <Row
          title="Latest releases this week"
          items={latestThisWeek}
          loading={rowsLoading}
          C={C}
          wishlist={wishlist}
          onToggleWishlist={onToggleWishlist}
          ownedProviderIds={ownedProviderIds}
          browsingCountry={homeCountry}
          onSeeAll={() =>
            navigate("/see-all", {
              state: {
                source : "latest-this-week",
                title:
                  "Latest movies this week",
                  watchRegion: toIsoRegion(homeCountry),
              },
            })
          }
        /> */}

        <Row
          title="Latest Movie on OTT"
          items={latestOttThisWeek}
          loading={rowsLoading}
          C={C}
          wishlist={wishlist}
          onToggleWishlist={onToggleWishlist}
          ownedProviderIds={ownedProviderIds}
          browsingCountry={homeCountry}
          onSeeAll={() =>
            navigate("/see-all", {
              state: {
                source: "latest-ott-movies",
                title: "Latest OTT Movie Releases ",
                watchRegion: toIsoRegion(homeCountry),
                browsingCountry: homeCountry
              },
            })
          }
        />

        <Row 
        title="Latest TV shows on OTT"
        items={latestOttTvThisWeek}
        loading={rowsLoading}
        C={C}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        ownedProviderIds={ownedProviderIds}
        browsingCountry={homeCountry}
        onSeeAll={()=>
          navigate("/see-all",{
            state: {
              source: "latest-ott-tv",
              title: "Latest OTT TV Releases",
              watchRegion: toIsoRegion(homeCountry),
              browsingCountry: homeCountry
            },
          })
        }
        />

        <Row
          title="TOP 10 Trending movies this week"
          items={topTrendingMovies}
          loading={rowsLoading}
          C={C}
          wishlist={wishlist}
          onToggleWishlist={onToggleWishlist}
          ownedProviderIds={ownedProviderIds}
          browsingCountry={homeCountry}
        />

        <Row
          title="TOP 10 Trending TV shows & series this week"
          items={topTrendingSeries}
          loading={rowsLoading}
          C={C}
          wishlist={wishlist}
          onToggleWishlist={onToggleWishlist}
          ownedProviderIds={ownedProviderIds}
          browsingCountry={homeCountry}
        />

        <Row 
          title="Most Popular Movies"
          items={mostPopularMovies}
          loading={rowsLoading}
          C={C}
          wishlist={wishlist}
          onToggleWishlist={onToggleWishlist}
          ownedProviderIds={ownedProviderIds}
          browsingCountry={homeCountry}
          onSeeAll={()=>
            navigate("/see-all",{
              state: {
                source: "most-popular-movies",
                title: "Most Popular Movies",
                watchRegion: toIsoRegion(homeCountry),
                browsingCountry: homeCountry,
              },
            })
          }        
          />


        <Row
          title="Most Popular TV Shows & Series"
          items={mostPopularTv}
          loading={rowsLoading}
          C={C}
          wishlist={wishlist}
          onToggleWishlist={onToggleWishlist}
          ownedProviderIds={ownedProviderIds}
          browsingCountry={homeCountry}
          onSeeAll={() =>
            navigate("/see-all", {
              state: {
                source: "most-popular-tv",
                title: "Most Popular TV Shows & Series",
                watchRegion: toIsoRegion(homeCountry),
                browsingCountry: homeCountry,
              },
            })
          }
        />

        <Row
          title="Top TMDb rated movies"
          items={topImdbRated}
          loading={rowsLoading}
          C={C}
          wishlist={wishlist}
          onToggleWishlist={onToggleWishlist}
          ownedProviderIds={ownedProviderIds}
          browsingCountry={homeCountry}
          onSeeAll={() =>
            navigate("/see-all", {
              state: {
                source : "top-imdb-rated",
                title: "Top TMDb rated",
                watchRegion: toIsoRegion(homeCountry),
                browsingCountry: homeCountry,
              },
            })
          }
        />

        <Row 
        title="Top TMDb Rated TV shows & series"
        items={topImdbRatedTv}
        loading={rowsLoading}
        C={C}
        wishlist={wishlist}
        onToggleWishlist={onToggleWishlist}
        ownedProviderIds={ownedProviderIds}
        browsingCountry={homeCountry}
        onSeeAll={()=>
          navigate("/see-all",{
            state: {
              source: "top-imdb-rated-tv",
              title: "Top TMDb rated TV shows & series",
              watchRegion: toIsoRegion(homeCountry),
              browsingCountry: homeCountry,
            }
          })
        }

        />

        {topProviders.map((p) => (
          <PlatformSection
            key={p.id}
            providerId={p.id}
            providerName={p.name}
            watchRegion={toIsoRegion(homeCountry)}
            C={C}
            wishlist={wishlist}
            onToggleWishlist={onToggleWishlist}
            ownedProviderIds={ownedProviderIds}
            browsingCountry={homeCountry}

            initialCat={platformTabs[p.id] || "trending"}

            onTabChange={(cat)=>{
              setPlatformTabs((prev)=> ({
                ...prev, [p.id]: cat,
              }));
            }}

            onSeeAll={(providerId, providerName, activeCat) =>
              navigate("/see-all", {
                state: {
                  source: "platform",
                  providerId,
                  providerName,
                  watchRegion:toIsoRegion(homeCountry),
                  browsingCountry: homeCountry,
                  activeCat,
                  title: `${providerName} — ${
                    activeCat === "trending"
                      ? "Trending"
                      : activeCat === "latest"
                        ? "Latest"
                        : activeCat === "movies"
                          ? "Movies"
                          : "Series"
                  }`,
                },
              })
            }
          />
        ))}
      </div>
    </div>
  );
}


