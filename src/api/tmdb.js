const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p";

const TOKEN = import.meta.env.VITE_TMDB_TOKEN;

if (!TOKEN) {
  // Loud warning instead of a silent, confusing network failure.
  console.warn(
    "VITE_TMDB_TOKEN is missing. Copy .env.example to .env and add your TMDB v4 Read Access Token."
  );
}

// Simple in-memory cache so switching tabs / re-rendering doesn't re-fetch
// the same URL over and over. Resets on page reload — fine for a prototype;
// swap for something persistent later if needed.
const cache = new Map();

async function tmdbFetch(path, params = {}) {
  const url = new URL(BASE_URL + path);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
  });
  const cacheKey = url.toString();
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const res = await fetch(cacheKey, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`TMDB request failed (${res.status}): ${body.status_message || res.statusText}`);
  }

  const data = await res.json();
  cache.set(cacheKey, data);
  return data;
}

// --- Image helpers -----------------------------------------------------
// size options TMDB supports for posters: w92, w154, w185, w342, w500, w780, original
// for backdrops: w300, w780, w1280, original
export function posterUrl(path, size = "w342") {
  return path ? `${IMAGE_BASE}/${size}${path}` : null;
}
export function backdropUrl(path, size = "w1280") {
  return path ? `${IMAGE_BASE}/${size}${path}` : null;
}
export function profileUrl(path, size = "w300") {
  return path ? `${IMAGE_BASE}/${size}${path}` : null;
}
export function providerLogoUrl(path, size = "w92") {
  return path ? `${IMAGE_BASE}/${size}${path}` : null;
}

// --- Watch providers master list -------------------------------------------
// Returns every real platform TMDB knows about for a region, sorted by how
// commonly used they are there. Used to populate My OTT's platform picker
// and the "Browse by Platform" row with real names/logos instead of a
// hardcoded list of 5.
export async function getWatchProviderList(mediaType = "movie", watchRegion = "US") {
  const data = await tmdbFetch(`/watch/providers/${mediaType}`, { watch_region: watchRegion });
  return (data.results || []).sort((a, b) => (a.display_priorities?.[watchRegion] ?? 999) - (b.display_priorities?.[watchRegion] ?? 999));
}

export function getTitleWatchProviders(mediaType, id) {
  return tmdbFetch(`/${mediaType}/${id}/watch/providers`);
}

export function getMovieReleaseDates(id) {
  return tmdbFetch(`/movie/${id}/release_dates`);
}

export async function getMovieProviders(){
  return tmdbFetch("/watch/providers/movie");
}



// --- Genres --------------------------------------------------------------
let genreMapCache = {};

export async function getGenreMap(mediaType = "movie") {
  if (genreMapCache[mediaType]) {
    return genreMapCache[mediaType];
  }

  const response = await tmdbFetch(`/genre/${mediaType}/list`);

  const map = {};

  response.genres.forEach((g) => {
    map[g.id] = g.name;
  });

  genreMapCache[mediaType] = map;

  return map;
}

// --- Search ----------------------------------------------------------------
export function searchMulti(query, page = 1) {
  return tmdbFetch("/search/multi", { query, page, include_adult: false });
}

// --- Trending / popular / top rated -----------------------------------------
// mediaType: "movie" | "tv" | "all"   window: "day" | "week"
export function getTrending(mediaType = "all", window = "week", page = 1) {
  return tmdbFetch(`/trending/${mediaType}/${window}`, { page });
}

export async function getCountryTrending(
  mediaType = "movie", 
  region = "IN",
  window = "week"
) {
  const MAX_RESULTS = 10;
  const MAX_PAGES = 5;

  const results = [];

  for (let page = 1; page <= MAX_PAGES && results.length < MAX_RESULTS; page++) {
    const trending = await getTrending(
      mediaType,
      window,
      page
    );

    const candidates = trending.results || [];

    if (!candidates.length) {
      break;
    }

    const availability = await Promise.all(
      candidates.map(async (item) => {
        try {
          const providers = await getTitleWatchProviders(
            mediaType,
            item.id
          );

          const country = providers?.results?.[region];

          const hasOtt =
            country?.flatrate?.length > 0 ||
            country?.free?.length > 0 ||
            country?.ads?.length > 0;

          return hasOtt ? item : null;
        } catch {
          return null;
        }
      })
    );

    for (const item of availability) {
      if (item) {
        results.push(item);

        if (results.length === MAX_RESULTS) {
          break;
        }
      }
    }
  }

  return {
    results,
    total_results: results.length,
    total_pages: 1,
  };
}

export function getRegionalPopular(
  mediaType = "movie",
  region = "IN",
  page = 1
) {
  return discover(mediaType, {
    region,
    sortBy: "popularity.desc",
    page,
  });
}
export function getPopular(mediaType = "movie", page = 1) {
  return tmdbFetch(`/${mediaType}/popular`, { page });
}
export function getTopRated(mediaType = "movie", page = 1) {
  return tmdbFetch(`/${mediaType}/top_rated`, { page });
}
export function getNowPlaying(page = 1) {
  return tmdbFetch("/movie/now_playing", { page });
}

export async function getCountryNowPlaying(
  region = "IN",
  page = 1
) {
  const MAX_RESULTS = 8;
  const MAX_PAGES = 2;

  const results = [];

  for (
    let currentPage = page;
    currentPage < page + MAX_PAGES &&
    results.length < MAX_RESULTS;
    currentPage++
  ) {
    const nowPlaying = await getNowPlaying(currentPage);

    const candidates = nowPlaying.results || [];

    if (!candidates.length) break;

    const availability = await Promise.all(
      candidates.map(async (item) => {
        try {
          const providers = await getTitleWatchProviders(
            "movie",
            item.id
          );

          const country = providers?.results?.[region];

          const hasOtt =
            country?.flatrate?.length > 0 ||
            country?.free?.length > 0 ||
            country?.ads?.length > 0;

          return hasOtt ? item : null;
        } catch {
          return null;
        }
      })
    );

    for (const item of availability) {
      if (item) {
        results.push(item);

        if (results.length === MAX_RESULTS) {
          break;
        }
      }
    }
  }

  return {
    results,
    total_results: results.length,
    total_pages: 1,
  };
}


export function getUpcoming(page = 1) {
  return tmdbFetch("/movie/upcoming", { page });
}

// --- Discover (used for platform pages, genre sections) -----------------------
// providerId: TMDB's numeric watch-provider id (from getWatchProviderList)
export function discover(
  mediaType = "movie",
  {
    genreId,
    providerId,
    watchRegion = "US",
    region,
    sortBy = "popularity.desc",
    page = 1,
    year,
    minRating,
    dateFrom,
    dateTo,
    releaseDateFrom,
    releaseDateTo,
    watchMonetizationTypes,
    withReleaseType,
  } = {}
) {
  return tmdbFetch(`/discover/${mediaType}`, {
    with_genres: genreId,
    with_watch_providers: providerId,
    watch_region: providerId || watchMonetizationTypes ? watchRegion : undefined,
    region,
    with_watch_monetization_types: watchMonetizationTypes,
    with_release_type : withReleaseType,

    ...(year
      ? mediaType === "movie"
        ? { primary_release_year: year }
        : { first_air_date_year: year }
      : {}),

          ...(dateFrom
      ? mediaType === "movie"
        ? { "primary_release_date.gte": dateFrom }
        : { "first_air_date.gte": dateFrom }
      : {}),

    ...(dateTo
      ? mediaType === "movie"
        ? { "primary_release_date.lte": dateTo }
        : { "first_air_date.lte": dateTo }
      : {}),

    ...(releaseDateFrom
      ? mediaType === "movie"
        ? { "release_date.gte": releaseDateFrom }
        : {}
      : {}),

...(releaseDateTo
  ? mediaType === "movie"
    ? { "release_date.lte": releaseDateTo }
    : {}
  : {}),

    "vote_average.gte": minRating,
    sort_by: sortBy,
    page,
  });
}

// --- Details / credits / videos / watch providers ------------------------------
export function getDetails(mediaType, id) {
  // append_to_response bundles credits + videos + watch/providers into one call
  return tmdbFetch(`/${mediaType}/${id}`, { append_to_response: "credits,videos,watch/providers" });
}

export function getSeasonDetails(seriesId, seasonNumber) {
  return tmdbFetch(`/tv/${seriesId}/season/${seasonNumber}`);
}

export function getRecommendations(mediaType, id, page = 1) {
  return tmdbFetch(`/${mediaType}/${id}/recommendations`, { page });
}



