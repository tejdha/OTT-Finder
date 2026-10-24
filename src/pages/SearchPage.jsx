import React, { useEffect, useMemo, useState } from "react";

import {
  discover,
  getGenreMap,
  searchMulti,
} from "../api/tmdb";

import { adaptListResponse } from "../api/adapters";
import { registerItems } from "../api/movieCache";

import {
  SearchBar,
  FilterDropdown,
  SortDropdown,
} from "../components/SearchAndFilters";

import { PosterCard } from "../components/Cards";
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
  "TV Show": "tv",
  "Web Series": "tv",
  Anime: "tv",
};


export default function SearchPage({
  C,
  wishlist,
  onToggleWishlist,
  ownedProviderIds,
  homeCountry,
  onHomeCountryChange,
  query,
  onQueryChange,
}) {

  // --------------------------------------------------
  // FILTER STATE
  // --------------------------------------------------

  const [genreFilter, setGenreFilter] = useState([]);
  const [yearFilter, setYearFilter] = useState([]);
  const [ratingFilter, setRatingFilter] = useState([]);
  const [typeFilter, setTypeFilter] = useState([]);
  const [sortOption, setSortOption] = useState("none");


  // --------------------------------------------------
  // GENERAL DATA
  // --------------------------------------------------

  const [genreMap, setGenreMap] = useState({});
  const [genreNameToId, setGenreNameToId] = useState({});


  // --------------------------------------------------
  // SEARCH
  // --------------------------------------------------

  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);


  // --------------------------------------------------
  // FILTER RESULTS
  // --------------------------------------------------

  const [filterResults, setFilterResults] = useState([]);
  const [filtering, setFiltering] = useState(false);


  // --------------------------------------------------
  // FILTER OPTIONS
  // --------------------------------------------------

  const yearOptions = useMemo(() => {
    const now = new Date().getFullYear();

    return Array.from(
      { length: 15 },
      (_, i) => String(now - i)
    );
  }, []);

  const ratingBuckets = [
    "9+",
    "8+",
    "7+",
    "6+",
  ];

  const typeOptions = [
    "Movie",
    "TV Show",
    "Web Series",
    "Anime",
  ];


  // --------------------------------------------------
  // GENRE MAP
  // --------------------------------------------------

  useEffect(() => {
    getGenreMap().then((map) => {
      setGenreMap(map);

      const nameToId = {};

      Object.entries(map).forEach(([id, name]) => {
        nameToId[name] = Number(id);
      });

      setGenreNameToId(nameToId);
    });
  }, []);


  // --------------------------------------------------
  // FILTER TOGGLES
  // --------------------------------------------------

  const toggleGenre = (genre) => {
    onQueryChange("");

    setGenreFilter((prev) =>
      prev.includes(genre)
        ? prev.filter((x) => x !== genre)
        : [...prev, genre]
    );
  };


  const toggleYear = (year) => {
    onQueryChange("");

    setYearFilter((prev) =>
      prev.includes(year)
        ? prev.filter((x) => x !== year)
        : [...prev, year]
    );
  };


  const toggleRating = (rating) => {
    onQueryChange("");

    setRatingFilter((prev) =>
      prev.includes(rating)
        ? prev.filter((x) => x !== rating)
        : [...prev, rating]
    );
  };


  const toggleType = (type) => {
    onQueryChange("");

    setTypeFilter((prev) =>
      prev.includes(type)
        ? prev.filter((x) => x !== type)
        : [...prev, type]
    );
  };


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
              (type) => TYPE_TO_MEDIA[type]
            )
          ),
        ]
      : ["movie", "tv"];


    const sortBy =
      sortOption === "az" ||
      sortOption === "za"
        ? "original_title.asc"
        : sortOption === "latest"
        ? "primary_release_date.desc"
        : sortOption === "oldest"
        ? "primary_release_date.asc"
        : sortOption === "toprated"
        ? "vote_average.desc"
        : sortOption === "popular"
        ? "popularity.desc"
        : "popularity.desc";


    const genreIds = genreFilter
      .map((genre) => genreNameToId[genre])
      .filter(Boolean)
      .join(",");


    const minRating = ratingFilter.length
      ? Math.min(
          ...ratingFilter.map(
            (rating) =>
              RATING_TO_VOTE_AVG[rating]
          )
        )
      : undefined;


    const years = yearFilter.length
      ? yearFilter
      : [undefined];


    Promise.all(
      mediaTypes.flatMap((mediaType) =>
        years.map((year) =>
          discover(mediaType, {
            genreId:
              genreIds || undefined,

            sortBy,

            year,

            minRating,
          }).then((res) => ({
            res,
            mediaType,
          }))
        )
      )
    )
      .then(async (responses) => {
        if (cancelled) return;

        const gMap = await getGenreMap();

        let combined = responses.flatMap(
          ({ res, mediaType }) =>
            adaptListResponse(
              res,
              gMap
            ).map((movie) => ({
              ...movie,

              tmdbMediaType:
                mediaType,

              type: mediaType,
            }))
        );


        if (sortOption === "za") {
          combined.sort((a, b) =>
            b.title.localeCompare(
              a.title
            )
          );
        } else if (sortOption === "az") {
          combined.sort((a, b) =>
            a.title.localeCompare(
              b.title
            )
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
    genreNameToId,
    query,
  ]);


  // --------------------------------------------------
  // MODES
  // --------------------------------------------------

  const isSearchMode =
    query.trim().length > 0;

  const isFilterMode =
    !isSearchMode &&
    hasActiveFilters;


  // --------------------------------------------------
  // HELPERS
  // --------------------------------------------------

  const wishlistCheck = (movie) =>
    wishlist.some(
      (item) =>
        item.id === movie.id &&
        item.mediaType ===
          movie.tmdbMediaType
    );


  // --------------------------------------------------
  // CLEAR
  // --------------------------------------------------

  const clearSearchAndFilters = () => {
    onQueryChange("");

    setGenreFilter([]);
    setYearFilter([]);
    setRatingFilter([]);
    setTypeFilter([]);
    setSortOption("none");
  };


  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div
      style={{
        paddingTop: 8,
        paddingBottom: 30,
      }}
    >

      {/* --------------------------------------------- */}
      {/* SEARCH */}
      {/* --------------------------------------------- */}

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


      {/* --------------------------------------------- */}
      {/* FILTERS */}
      {/* --------------------------------------------- */}

      <div
        style={{
          display: "flex",
          gap: 10,
          justifyContent: "center",
          marginBottom: 28,
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
          options={Object.values(genreMap)}
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


      {/* --------------------------------------------- */}
      {/* RESULTS */}
      {/* --------------------------------------------- */}

      {(isSearchMode || isFilterMode) && (

        <div>

          {/* CLEAR BUTTON */}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 18,
            }}
          >
            <button
              onClick={clearSearchAndFilters}
              style={{
                border:
                  "1px solid rgba(255,255,255,0.10)",
                borderRadius: 10,
                background:
                  "rgba(10,10,14,0.45)",
                color: C.text,
                padding: "8px 14px",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Clear
            </button>
          </div>


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
                {searchResults.map((movie) => (

                  <PosterCard
                    key={`${movie.tmdbMediaType}-${movie.id}`}
                    movie={movie}
                    C={C}
                    wishlisted={wishlistCheck(movie)}
                    onToggleWishlist={
                      onToggleWishlist
                    }
                    ownedProviderIds={
                      ownedProviderIds
                    }
                  />

                ))}
              </div>

            )

          ) : (

            /* FILTER RESULTS */

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
                {filterResults.map((movie) => (

                  <PosterCard
                    key={`${movie.tmdbMediaType}-${movie.id}`}
                    movie={movie}
                    C={C}
                    wishlisted={wishlistCheck(movie)}
                    onToggleWishlist={
                      onToggleWishlist
                    }
                    ownedProviderIds={
                      ownedProviderIds
                    }
                  />

                ))}
              </div>

            )

          )}

        </div>

      )}

    </div>
  );
}