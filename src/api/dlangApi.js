
export async function getStreamingAvailability(tmdbId, mediaType, country) {
  const params = new URLSearchParams({
    tmdbId: String(tmdbId),
    mediaType,
    country,
  });

  const response = await fetch(`/api/availability?${params}`);

  if (!response.ok) {
    throw new Error(`Streaming Availability API error: ${response.status}`);
  }

  return response.json();
}


// export async function getStreamingAvailability(tmdbId, mediaType, country) {
//   const params = new URLSearchParams({
//     tmdbId: String(tmdbId),
//     mediaType,
//     country,
//   });

//   const response = await fetch(`/api/availability?${params}`);

//   if (!response.ok) {
//     throw new Error(`Streaming Availability API error: ${response.status}`);
//   }

//   return response.json();
// }

// const IMAGE_BASE = "https://image.tmdb.org/t/p";

// const TOKEN = import.meta.env.VITE_TMDB_TOKEN;

// if (!TOKEN) {
//   // Loud warning instead of a silent, confusing network failure.
//   console.warn(
//     "VITE_TMDB_TOKEN is missing. Copy .env.example to .env and add your TMDB v4 Read Access Token."
//   );
// }

// // Simple in-memory cache so switching tabs / re-rendering doesn't re-fetch
// // the same URL over and over. Resets on page reload — fine for a prototype;
// // swap for something persistent later if needed.
// const cache = new Map();

// async function tmdbFetch(path, params = {}) {
//   const url = new URL(BASE_URL + path);
//   Object.entries(params).forEach(([key, value]) => {
//     if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
//   });
//   const cacheKey = url.toString();
//   if (cache.has(cacheKey)) return cache.get(cacheKey);

//   const res = await fetch(cacheKey, {
//     headers: {
//       Authorization: `Bearer ${TOKEN}`,
//       "Content-Type": "application/json",
//     },
//   });

//   if (!res.ok) {
//     const body = await res.json().catch(() => ({}));
//     throw new Error(`TMDB request failed (${res.status}): ${body.status_message || res.statusText}`);
//   }

//   const data = await res.json();
//   cache.set(cacheKey, data);
//   return data;
// }

// // --- Image helpers -----------------------------------------------------
// // size options TMDB supports for posters: w92, w154, w185, w342, w500, w780, original
// // for backdrops: w300, w780, w1280, original
// export function posterUrl(path, size = "w500") {
//   return path ? `${IMAGE_BASE}/${size}${path}` : null;
// }
// export function backdropUrl(path, size = "w1280") {
//   return path ? `${IMAGE_BASE}/${size}${path}` : null;
// }
// export function profileUrl(path, size = "w300") {
//   return path ? `${IMAGE_BASE}/${size}${path}` : null;
// }
// export function providerLogoUrl(path, size = "w92") {
//   return path ? `${IMAGE_BASE}/${size}${path}` : null;
// }

// // --- Watch providers master list -------------------------------------------
// // Returns every real platform TMDB knows about for a region, sorted by how
// // commonly used they are there. Used to populate My OTT's platform picker
// // and the "Browse by Platform" row with real names/logos instead of a
// // hardcoded list of 5.
// export async function getWatchProviderList(mediaType = "movie", watchRegion = "US") {
//   const data = await tmdbFetch(`/watch/providers/${mediaType}`, { watch_region: watchRegion });
//   return (data.results || []).sort((a, b) => (a.display_priorities?.[watchRegion] ?? 999) - (b.display_priorities?.[watchRegion] ?? 999));
// }

// export function getTitleWatchProviders(mediaType, id) {
//   return tmdbFetch(`/${mediaType}/${id}/watch/providers`);
// }

// export function getMovieReleaseDates(id) {
//   return tmdbFetch(`/movie/${id}/release_dates`);
// }

// export async function getMovieProviders(){
//   return tmdbFetch("/watch/providers/movie");
// }



// // --- Genres --------------------------------------------------------------
// let genreMapCache = {};

// export async function getGenreMap(mediaType = "movie") {
//   if (genreMapCache[mediaType]) {
//     return genreMapCache[mediaType];
//   }

//   const response = await tmdbFetch(`/genre/${mediaType}/list`);

//   const map = {};

//   response.genres.forEach((g) => {
//     map[g.id] = g.name;
//   });

//   genreMapCache[mediaType] = map;

//   return map;
// }

// // --- Search ----------------------------------------------------------------
// export function searchMulti(query, page = 1) {
//   return tmdbFetch("/search/multi", { query, page, include_adult: false });
// }

// // --- Trending / popular / top rated -----------------------------------------
// // mediaType: "movie" | "tv" | "all"   window: "day" | "week"
// export function getTrending(mediaType = "all", window = "week", page = 1) {
//   return tmdbFetch(`/trending/${mediaType}/${window}`, { page });
// }





