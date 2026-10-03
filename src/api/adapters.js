import { posterUrl, backdropUrl, profileUrl, providerLogoUrl } from "./tmdb";
import { PROVIDER_URLS_IN } from "../data/movies";


// Normalizes one entry from getWatchProviderList() into what the UI needs.
export function adaptProvider(p, watchRegion = "IN", ) {
  return { 
    id: p.provider_id,
    name: p.provider_name,
    logo: providerLogoUrl(p.logo_path),
    url: watchRegion === "IN" ? PROVIDER_URLS_IN[p.provider_id] || null : null,
  };
}

export function adaptProviderList(list, watchRegion = "IN") {
  return list.map((p)=> adaptProvider(p, watchRegion));
}

// Converts one TMDB search/trending/discover result item into our internal shape.
// genreMap: { [genreId]: genreName } from getGenreMap()
export function adaptListItem(item, genreMap) {
  const mediaType = item.media_type || (item.first_air_date ? "tv" : "movie");
  const isTv = mediaType === "tv";
  return {
    id: item.id,
    tmdbMediaType: mediaType, // "movie" | "tv" — needed to call the right detail endpoint later
    title: isTv ? item.name : item.title,
    type: isTv ? "tv" : "movie", // NOTE: TMDB doesn't distinguish "web series" from "tv" — both land here as "tv"
    year: (isTv ? item.first_air_date : item.release_date)?.slice(0, 4) || "\u2014",
    rating: item.vote_average ? Math.round(item.vote_average * 10) / 10 : 0,
    genres: (item.genre_ids || []).map((id) => genreMap[id]).filter(Boolean),
    poster: posterUrl(item.poster_path),
    backdrop: backdropUrl(item.backdrop_path),
    overview: item.overview,
    // country, providers, cast, runtime are NOT in list responses —
    // they only come from the detail endpoint (see adaptDetails below).
    country: null,
    providers: [],
    cast: [],
    runtime: null,
  };
}

export function adaptListResponse(response, genreMap) {
  return (response.results || [])
    .filter((item) => item.media_type !== "person") // multi-search can return people; drop them
    .map((item) => adaptListItem(item, genreMap));
}

// Converts a full TMDB detail response (with append_to_response=credits,videos,watch/providers)
// into our internal shape, filling in the fields list endpoints can't provide.
export function adaptDetails(details, mediaType, watchRegion = "IN") {
  const isTv = mediaType === "tv";
  const providersForRegion = details["watch/providers"]?.results?.[watchRegion];
  const flatrate = (providersForRegion?.flatrate || []).map(adaptProvider);
  const rent = (providersForRegion?.rent || []).map(adaptProvider);
  const buy = (providersForRegion?.buy || []).map(adaptProvider);
  const free = (providersForRegion?.free || []).map(adaptProvider);
  const ads = (providersForRegion?.ads || []).map(adaptProvider);

  return {
    id: details.id,
    tmdbMediaType: mediaType,
    title: isTv ? details.name : details.title,
    type: isTv ? "tv" : "movie",
    year: (isTv ? details.first_air_date : details.release_date)?.slice(0, 4) || "\u2014",
    rating: details.vote_average ? Math.round(details.vote_average * 10) / 10 : 0,
    runtime: isTv
      ? null
      : details.runtime
        ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m`
        : "—",

    seasons: isTv
      ? details.number_of_seasons || 0
      : null,

    episodes: isTv
      ? details.number_of_episodes || 0
      : null,

    episodeRuntime: isTv
      ? details.episode_run_time?.[0] || null
      : null,

    genres: (details.genres || []).map((g) => g.name),

    poster: posterUrl(details.poster_path, "w500"),
    backdrop: backdropUrl(details.backdrop_path, "w1280"),
    overview: details.overview,

  releaseDate: isTv
  ? details.first_air_date || null
  : details.release_date || null,

  lastAirDate: isTv
    ? details.last_air_date || null
    : null,

  originalLanguage: details.original_language || null,

  originCountries: (details.production_countries || []).map(
    (country) => country.name
  ),

  dubbedLanguages: [],

    country: providersForRegion ? watchRegion : null,
    // Normalized { id, name, logo } objects, grouped by how you can watch —
    // replaces the old string-key ("netflix") + PRICING lookup approach.
    // TMDB never gives an actual price, so pricing UI should show the
    // category label ("Subscription" / "Rent" / "Buy" / "Free") not a number.
    watchProviders: { flatrate, rent, buy, free, ads },
    cast: (details.credits?.cast || []).slice(0, 10).map((c) => ({
      name: c.name,
      role: c.character,
      photo: profileUrl(c.profile_path),
    })),

    director: (details.credits?.crew || [])
  .filter((person) => person.job === "Director")
  .map((person) => person.name),

creator: (details.created_by || []).map(
  (person) => person.name
),

music: (details.credits?.crew || [])
  .filter((person) =>
    ["Original Music Composer", "Music", "Composer"].includes(person.job)
  )
  .map((person) => person.name),

    videos: (details.videos?.results || []).filter((v) => v.site === "YouTube"),
  };
}
