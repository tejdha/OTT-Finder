import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Heart, Star as StarIcon } from "lucide-react";
import { glassStyle, DISPLAY_FONT, BODY_FONT } from "../styles/theme";
import { ALL_COUNTRIES, toIsoRegion } from "../api/regions";
import { getDetails, getRecommendations, getGenreMap, getSeasonDetails, providerLogoUrl } from "../api/tmdb";
import { adaptDetails, adaptListResponse, adaptProvider } from "../api/adapters";
import { registerItems } from "../api/movieCache";
import { Sheen } from "../components/Primitives";
import { ProviderPill, PosterCard } from "../components/Cards";
import RegionSelect from "../components/RegionSelect";

import { getStreamingAvailability } from "../api/dlangApi";
   import NotFoundPage from "./notfoundpage";

const LANGUAGE_NAMES = {
  en: "English",
  hi: "Hindi",
  ta: "Tamil",
  te: "Telugu",
  ml: "Malayalam",
  kn: "Kannada",
  bn: "Bengali",
  mr: "Marathi",
  pa: "Punjabi",
  gu: "Gujarati",
  ur: "Urdu",
  or: "Odia",
  as: "Assamese",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
  fr: "French",
  de: "German",
  es: "Spanish",
  it: "Italian",
  pt: "Portuguese",
  ru: "Russian",
  ar: "Arabic",
  tr: "Turkish",
  fa: "Persian",
  th: "Thai",
  vi: "Vietnamese",
  id: "Indonesian",
  ms: "Malay",
  nl: "Dutch",
  pl: "Polish",
  sv: "Swedish",
  da: "Danish",
  no: "Norwegian",
  fi: "Finnish",
  cs: "Czech",
  hu: "Hungarian",
  ro: "Romanian",
  uk: "Ukrainian",
  he: "Hebrew",
  el: "Greek",
};

const AUDIO_LANGUAGE_NAMES = {
  eng: "English",
  hin: "Hindi",
  tam: "Tamil",
  tel: "Telugu",
  kan: "Kannada",
  mal: "Malayalam",
  ben: "Bengali",
  mar: "Marathi",
  pan: "Punjabi",
  guj: "Gujarati",
  urd: "Urdu",
  ori: "Odia",
  asm: "Assamese",

  jpn: "Japanese",
  kor: "Korean",
  zho: "Chinese",
  fra: "French",
  deu: "German",
  spa: "Spanish",
  ita: "Italian",
  por: "Portuguese",
  rus: "Russian",
  ara: "Arabic",
  tur: "Turkish",
  fas: "Persian",
  tha: "Thai",
  vie: "Vietnamese",
  ind: "Indonesian",
  msa: "Malay",
  nld: "Dutch",
  pol: "Polish",
  swe: "Swedish",
  dan: "Danish",
  nor: "Norwegian",
  fin: "Finnish",
  ces: "Czech",
  hun: "Hungarian",
  ron: "Romanian",
  ukr: "Ukrainian",
  heb: "Hebrew",
  ell: "Greek",
};

export default function MovieDetailPage({ C, wishlist, onToggleWishlist, ownedProviderIds, userCountry, onManualCountry }) {
  const { mediaType, id } = useParams();
  const validParams =
    (mediaType === "movie" || mediaType === "tv") && /^\d{1,9}$/.test(id || "");
  const navigate = useNavigate();

  const location = useLocation();
  const browsingCountry = location.state?.browsingCountry || null;
  

  const [rawDetails, setRawDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [related, setRelated] = useState([]);
  const [priceTab, setPriceTab] = useState("all");
  const [relatedVisible, setRelatedVisible] = useState(10);
  
  const [isSmallScreen, setIsSmallScreen] = useState(
  () => window.innerWidth < 900
);

useEffect(() => {
  const handleResize = () => {
    setIsSmallScreen(window.innerWidth < 900);
  };

  window.addEventListener("resize", handleResize);

  return () => {
    window.removeEventListener("resize", handleResize);
  };
}, []);

const [episodeRuntime, setEpisodeRuntime] = useState(null);



  const [dubbedLanguages, setDubbedLanguages] = useState([]);
  const [streamingOptions, setStreamingOptions] = useState([]);

  

  const [selectedAvailabilityCountry, setSelectedAvailabilityCountry] =
  useState(browsingCountry || userCountry);

  useEffect(() => {
  setSelectedAvailabilityCountry(browsingCountry || userCountry);
}, [browsingCountry, userCountry]);

     

  useEffect(() => {

    if (!validParams) {
     setLoading(false);
     return;
   }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getDetails(mediaType, id)
      .then((data) => { if (!cancelled) setRawDetails(data); })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    Promise.all([
      getRecommendations(mediaType, id,1),
      getRecommendations(mediaType, id,2),
      getRecommendations(mediaType, id,3),
       getGenreMap()
      ])
      .then(([res1, res2, res3, gMap]) => {
        if (cancelled) return;
        const combined = [
          ...(res1.results || []),
          ...(res2.results || []),
          ...(res3.results || []),
        ];
        const adapted = adaptListResponse({results : combined,}, gMap).map((m) => ({ ...m, tmdbMediaType: m.tmdbMediaType || mediaType }));
        registerItems(adapted);
        setRelated(adapted);  //adapted.slice(0,8)
      })
      .catch(() => !cancelled && setRelated([]));
    return () => { cancelled = true; };
  }, [mediaType, id, validParams]);

  useEffect(() => {
  if (mediaType !== "tv" || !rawDetails) {
    setEpisodeRuntime(null);
    return;
  }

  

  // TMDB sometimes provides a series-level runtime directly.
  if (rawDetails.episode_run_time?.length) {
    setEpisodeRuntime(rawDetails.episode_run_time[0]);
    return;
  }

  const seasonNumber = rawDetails.number_of_seasons
    ? 1
    : null;

  if (!seasonNumber) {
    setEpisodeRuntime(null);
    return;
  }

  let cancelled = false;

  getSeasonDetails(id, seasonNumber)
    .then((data) => {
      if (cancelled) return;

      const runtimes = (data.episodes || [])
        .map((episode) => episode.runtime)
        .filter((runtime) => Number.isFinite(runtime) && runtime > 0);

      if (!runtimes.length) {
        setEpisodeRuntime(null);
        return;
      }

      // Use the most common runtime among the episodes.
      const frequency = {};

      runtimes.forEach((runtime) => {
        frequency[runtime] = (frequency[runtime] || 0) + 1;
      });

      const mostCommonRuntime = runtimes.reduce((best, runtime) =>
        frequency[runtime] > frequency[best] ? runtime : best
      );

      setEpisodeRuntime(mostCommonRuntime);
    })
    .catch(() => {
      if (!cancelled) setEpisodeRuntime(null);
    });

  return () => {
    cancelled = true;
  };
}, [mediaType, id, rawDetails]);


const regionIso = toIsoRegion(selectedAvailabilityCountry);

useEffect(() => {
  if (!rawDetails || !id) {
    setDubbedLanguages([]);
    return;
  }

  let cancelled = false;
  setDubbedLanguages([]);

  getStreamingAvailability(id, mediaType, regionIso)
    .then((data) => {
      if (cancelled) return;

      const countryOptions =
        data?.streamingOptions?.[regionIso.toLowerCase()] || [];

      setStreamingOptions(countryOptions);



      const languages = countryOptions.flatMap((option) =>
        (option.audios || [])
          .map((audio) => audio.language)
          .filter(Boolean)
      );

      const originalLanguageName =
  LANGUAGE_NAMES[movie.originalLanguage];

const uniqueLanguages = [...new Set(languages)];

const dubbedLanguages = uniqueLanguages.filter((code) => {
  const languageName = AUDIO_LANGUAGE_NAMES[code] || code;

  return languageName !== originalLanguageName;
});

const names = dubbedLanguages.map(
  (code) => AUDIO_LANGUAGE_NAMES[code] || code
);

      setDubbedLanguages(names);
    })
    .catch((error) => {

      if (!cancelled) {
        setDubbedLanguages([]);
        
      }
    });

  return () => {
    cancelled = true;
  };
}, [id, mediaType, regionIso, rawDetails]);

const movie = useMemo(() => {
  if (!rawDetails) return null;

  const adapted = adaptDetails(
    rawDetails,
    mediaType,
    regionIso
  );

  const regionProviders =
    rawDetails?.["watch/providers"]?.results?.[regionIso];
    if (regionProviders) {
  const allProviders = [
    ...(regionProviders.flatrate || []),
    ...(regionProviders.rent || []),
    ...(regionProviders.buy || []),
    ...(regionProviders.free || []),
    ...(regionProviders.ads || []),
  ];
}


const normalizeProviders = (providers = []) =>
  providers.map((provider) => adaptProvider(provider, regionIso));

  adapted.watchProviders = {
    flatrate: normalizeProviders(regionProviders?.flatrate),
    rent: normalizeProviders(regionProviders?.rent),
    buy: normalizeProviders(regionProviders?.buy),
    free: normalizeProviders(regionProviders?.free),
    ads: normalizeProviders(regionProviders?.ads),
  };

  return adapted;
}, [rawDetails, mediaType, regionIso]);

  useEffect(() => {
    if (movie) registerItems([{ ...movie, tmdbMediaType: mediaType }]);
  }, [movie, mediaType]);

    if (!validParams) return <NotFoundPage C={C} title="Title not found" message="This link doesn't point to a valid movie or show." />;
   if (loading) return <div style={{ color: C.text, fontFamily: BODY_FONT, padding: "60px 0", textAlign: "center" }}>Loading...</div>;
   if (error || !movie) return <NotFoundPage C={C} title="Couldn't load this title" message="It may not exist, or the service is unavailable right now. Please try again." />;

  const wishlisted = wishlist.some((w) => w.id === movie.id && w.mediaType === mediaType);
  const videos = (movie.videos || []).slice(0, 3);
  const availableInRegion = !!(movie.watchProviders.flatrate.length || movie.watchProviders.rent.length || movie.watchProviders.buy.length || movie.watchProviders.free.length || movie.watchProviders.ads.length);

  

const priceTabbedProviders = () => {
  const { flatrate, rent, buy, free, ads } = movie.watchProviders;

  let providers = [];

  if (priceTab === "all") {
    providers = [
      ...flatrate.map((p) => ({ p, categories: ["flatrate"] })),
      ...rent.map((p) => ({ p, categories: ["rent"] })),
      ...buy.map((p) => ({ p, categories: ["buy"] })),
      ...free.map((p) => ({ p, categories: ["free"] })),
      ...ads.map((p) => ({ p, categories: ["ads"] })),
    ];
  }

  if (priceTab === "subscription") {
    providers = flatrate.map((p) => ({
      p,
      categories: ["flatrate"],
    }));
  }

  if (priceTab === "rent") {
    providers = [
      ...rent.map((p) => ({ p, categories: ["rent"] })),
      ...buy.map((p) => ({ p, categories: ["buy"] })),
    ];
  }

  if (priceTab === "free") {
    providers = [
      ...free.map((p) => ({ p, categories: ["free"] })),
      ...ads.map((p) => ({ p, categories: ["ads"] })),
    ];
  }

  // Deduplicate ONLY identical TMDB provider IDs.
  const uniqueProviders = new Map();

  providers.forEach(({ p, categories }) => {
    if (!uniqueProviders.has(p.id)) {
      uniqueProviders.set(p.id, {
        p,
        categories: [...categories],
      });
    } else {
      const existing = uniqueProviders.get(p.id);

      categories.forEach((category) => {
        if (!existing.categories.includes(category)) {
          existing.categories.push(category);
        }
      });
    }
  });

  return [...uniqueProviders.values()];
};

const shownProviders = priceTabbedProviders();
  
  
  // languages func for languages
  const originalLanguage =
  LANGUAGE_NAMES[movie.originalLanguage] ||
  movie.originalLanguage ||
  "—";

  

  return (
    <div>
      <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: C.muted, fontFamily: BODY_FONT, fontSize: 14, cursor: "pointer", padding: "0 0 20px 0" }}>&larr; Back</button>

      <div style={{ borderRadius: 22, ...glassStyle(C, { padding: 0 }), display: "flex", flexWrap: "wrap" }}>
        <div style={{ position: "relative", width: 230, flexShrink: 0, padding: 14 }}>
          {movie.poster ? (
            <img src={movie.poster} alt={movie.title} style={{ width: "100%", borderRadius: 14, boxShadow: "0 10px 24px rgba(0,0,0,0.35)", display: "block" }} />
          ) : (
            <div style={{ width: "100%", aspectRatio: "2/3", borderRadius: 14, background: C.iconBg }} />
          )}
          <button onClick={() => onToggleWishlist({ id: movie.id, mediaType })} style={{ position: "absolute", top: 22, right: 22, width: 32, height: 32, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Heart size={15} color={wishlisted ? C.coralSolid : "#F2F2F5"} fill={wishlisted ? C.coralSolid : "none"} />
          </button>
        </div>
        <div style={{ position: "relative", flex: "1 1 300px", minHeight: 240, borderRadius: "0 22px 22px 0", overflow: "hidden" }}>
          {movie.backdrop && <img src={movie.backdrop} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(6px)", transform: "scale(1.1)" }} />}
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />
          <div style={{ position: "relative", padding: "24px 32px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", height: "100%", boxSizing: "border-box" }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
              >
              <h1
                style={{
                  fontFamily: DISPLAY_FONT,
                  fontWeight: 800,
                  fontSize: 26,
                  color: "#FFFFFF",
                  margin: 0,
                }}
              >
                {movie.title}
              </h1>

              <span
                style={{
                  fontFamily: BODY_FONT,
                  fontSize: 15,
                  color: "rgba(255,255,255,0.75)",
                }}
              >
                ({movie.year})
              </span>
            </div>
            <div
  style={{
    fontFamily: BODY_FONT,
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginTop: 8,
  }}
>
  {mediaType === "tv" ? "TV Show / Series" : "Movie"} :{" "}
  {mediaType === "tv"
    ? `${movie.seasons || 0} ${
        movie.seasons === 1 ? "season" : "seasons"
      }`
    : movie.runtime
      ? movie.runtime.replace("h ", " h ").replace("m", "min")
      : "—"}
</div>
            <div
              style={{
                fontFamily: BODY_FONT,
                fontSize: 13,
                color: "rgba(255,255,255,0.8)",
                marginTop: 4,
              }}
            >
              {originalLanguage}
            </div>
            <div style={{ fontFamily: BODY_FONT, fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>{movie.genres.join(", ")}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
              <StarIcon size={15} fill="#F5B942" color="#F5B942" />
              <span style={{ fontFamily: BODY_FONT, fontSize: 14, fontWeight: 700, color: "#F5B942" }}>{movie.rating}/10 TMDB</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 32, textAlign: "left" }}>
        <h2 style={{ fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: 19, color: C.text, margin: "0 0 20px 0" }}>Where to watch</h2>
        <div style={{marginBottom: 25}}>
        <RegionSelect selectedCountryName={selectedAvailabilityCountry} onManualSelect={setSelectedAvailabilityCountry} C={C} />
        </div>

        {!availableInRegion ? (
          <div style={{ padding: "12px 16px", borderRadius: 14, ...glassStyle(C), border: `1px solid ${C.coralSolid}` }}>
            <Sheen C={C} />
            <div style={{ position: "relative", fontFamily: BODY_FONT, fontSize: 12, color: C.text }}>
              Not available on any platform we can find in {selectedAvailabilityCountry || regionIso}. Try selecting a different country above.
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
              {[{ id: "all", label: "All" }, { id: "free", label: "Free" }, { id: "subscription", label: "Subscription" }, { id: "rent", label: "Rent" }].map((t) => {
                const isSelected = priceTab === t.id;
                return (
                  <button key={t.id} onClick={() => setPriceTab(t.id)} style={{ padding: "7px 14px", borderRadius: 999, border: isSelected ? `1px solid ${C.glassBorder}` : "1px solid transparent", cursor: "pointer", fontFamily: BODY_FONT, fontSize: 12, fontWeight: 600, background: isSelected ? C.glass : "transparent", color: isSelected ? C.coralSolid : C.muted }}>
                    {t.label}
                  </button>
                );
              })}
            </div>
            {shownProviders.length === 0 ? (
              <div style={{ fontFamily: BODY_FONT, fontSize: 12, color: C.muted }}>No platforms offer this title that way right now.</div>
            ) : (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "flex-start" }}>
                {shownProviders.map(({ p, categories }) => (
              <ProviderPill
                key={p.id}
                provider={p}
                categories={categories}
                C={C}
                owned={ownedProviderIds.includes(p.id)}
              />
            ))}
              </div>
            )}
          </div>
        )}

          <div style={{ marginTop: 12, fontFamily: BODY_FONT, fontSize: 11, color: C.muted }}>
          Availability data provided by{" "}
          <a href="https://www.justwatch.com/" target="_blank" rel="noopener noreferrer" style={{ color: C.muted, textDecoration: "underline" }}>JustWatch</a>
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
        <h2 style={{ fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: 19, color: C.text, margin: "0 0 8px 0" }}>Overview</h2>
        <p style={{ fontFamily: BODY_FONT, fontSize: 16, lineHeight: 1.75, color: C.text, maxWidth: "100%", margin: 0 }}>{movie.overview || "No overview available."}</p>
      </div>

      {/* Information */}
<div style={{ marginTop: 28 }}>
  <h2
    style={{
      fontFamily: DISPLAY_FONT,
      fontWeight: 700,
      fontSize: 19,
      color: C.text,
      margin: "0 0 14px 0",
    }}
  >
    Information
  </h2>

  <div
    style={{
      ...glassStyle(C),
      borderRadius: 16,
      padding: isSmallScreen ? 20 : 16,
      boxSizing: "border-box",
      width: "100%",
    }}
  >

    {/* =====================================================
        MOVIE INFORMATION
        ===================================================== */}
    {mediaType === "movie" && (
      <>
        {/* =========================
            MOVIE — DESKTOP
        ========================== */}
        {!isSmallScreen && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 12,
              }}
            >

              {/* CARD 1 — OVERVIEW */}
              <div
                style={{
                  ...glassStyle(C),
                  borderRadius: 14,
                  padding: "14px 16px",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 13,
                    color: C.muted,
                    marginBottom: 10,
                  }}
                >
                  Overview
                </div>

                {[
                  ["Title", movie.title || "—"],
                  ["Duration", movie.runtime || "—"],
                  ["Original language", originalLanguage || "—"],
                  [
                    "TMDB rating",
                    movie.rating ? `${movie.rating}/10` : "—",
                  ],
                ].map(([label, value], index, arr) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      padding: "8px 0",
                      borderBottom:
                        index < arr.length - 1
                          ? `1px solid ${C.glassBorder}`
                          : "none",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: BODY_FONT,
                        fontSize: 12,
                        color: C.muted,
                      }}
                    >
                      {label}
                    </span>

                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: label === "TMDB rating" ? 5 : 0,
                        fontFamily: BODY_FONT,
                        fontSize: 13,
                        color:
                          label === "TMDB rating" && movie.rating
                            ? "#F5B942"
                            : C.text,
                        fontWeight: 600,
                        textAlign: "right",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {label === "TMDB rating" && movie.rating && (
                        <StarIcon
                          size={14}
                          fill="#F5B942"
                          color="#F5B942"
                        />
                      )}

                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* CARD 2 — RELEASE & LANGUAGE */}
              <div
                style={{
                  ...glassStyle(C),
                  borderRadius: 14,
                  padding: "14px 16px",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 13,
                    color: C.muted,
                    marginBottom: 10,
                  }}
                >
                  Release and language
                </div>

                {[
                  ["Type", "Movie"],
                  ["Release date", movie.releaseDate || "—"],
                  [
                    "Dubbed language",
                    dubbedLanguages.length
                      ? dubbedLanguages.join(", ")
                      : "—",
                  ],
                ].map(([label, value], index, arr) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      padding: "8px 0",
                      borderBottom:
                        index < arr.length - 1
                          ? `1px solid ${C.glassBorder}`
                          : "none",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: BODY_FONT,
                        fontSize: 12,
                        color: C.muted,
                      }}
                    >
                      {label}
                    </span>

                    <span
                      style={{
                        fontFamily: BODY_FONT,
                        fontSize: 13,
                        color: C.text,
                        fontWeight: 600,
                        textAlign: "right",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* CARD 3 — CREDITS */}
              <div
                style={{
                  ...glassStyle(C),
                  borderRadius: 14,
                  padding: "14px 16px",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 13,
                    color: C.muted,
                    marginBottom: 10,
                  }}
                >
                  Credits
                </div>

                {[
                  [
                    "Director",
                    movie.director?.length
                      ? movie.director.join(", ")
                      : "—",
                  ],
                  [
                    "Music",
                    movie.music?.length
                      ? movie.music.join(", ")
                      : "—",
                  ],
                  [
                    "Country",
                    movie.originCountries?.length
                      ? movie.originCountries.join(", ")
                      : "—",
                  ],
                ].map(([label, value], index, arr) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      padding: "8px 0",
                      borderBottom:
                        index < arr.length - 1
                          ? `1px solid ${C.glassBorder}`
                          : "none",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: BODY_FONT,
                        fontSize: 12,
                        color: C.muted,
                      }}
                    >
                      {label}
                    </span>

                    <span
                      style={{
                        fontFamily: BODY_FONT,
                        fontSize: 13,
                        color: C.text,
                        fontWeight: 600,
                        textAlign: "right",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* GENRE + CAST */}
            <div
              style={{
                ...glassStyle(C),
                borderRadius: 14,
                padding: "14px 16px",
                marginTop: 12,
              }}
            >
              <div
                style={{
                  fontFamily: BODY_FONT,
                  fontSize: 12,
                  color: C.muted,
                  marginBottom: 7,
                }}
              >
                Genre
              </div>

              <div
                style={{
                  fontFamily: BODY_FONT,
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.text,
                  lineHeight: 1.7,
                }}
              >
                {movie.genres?.length
                  ? movie.genres.join(", ")
                  : "—"}
              </div>

              <div
                style={{
                  fontFamily: BODY_FONT,
                  fontSize: 12,
                  color: C.muted,
                  marginTop: 14,
                  marginBottom: 7,
                }}
              >
                Cast
              </div>

              <div
                style={{
                  fontFamily: BODY_FONT,
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.text,
                  lineHeight: 1.7,
                }}
              >
                {movie.cast?.length
                  ? movie.cast.map((person) => person.name).join(", ")
                  : "—"}
              </div>
            </div>
          </>
        )}

        {/* =========================
            MOVIE — MOBILE
        ========================== */}
        {isSmallScreen && (
          <>
            {/* Title / Duration */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 10,
              }}
            >
              <div
                style={{
                  ...glassStyle(C),
                  borderRadius: 14,
                  padding: "12px 14px",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 11,
                    color: C.muted,
                    marginBottom: 5,
                  }}
                >
                  Title
                </div>

                <div
                  style={{
                    fontFamily: DISPLAY_FONT,
                    fontSize: 18,
                    lineHeight: 1.2,
                    fontWeight: 700,
                    color: C.text,
                    overflowWrap: "anywhere",
                  }}
                >
                  {movie.title || "—"}
                </div>
              </div>

              <div
                style={{
                  ...glassStyle(C),
                  borderRadius: 14,
                  padding: "12px 14px",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 11,
                    color: C.muted,
                    marginBottom: 5,
                  }}
                >
                  Duration
                </div>

                <div
                  style={{
                    fontFamily: DISPLAY_FONT,
                    fontSize: 19,
                    lineHeight: 1.2,
                    fontWeight: 700,
                    color: C.text,
                  }}
                >
                  {movie.runtime || "—"}
                </div>
              </div>

              <div
                style={{
                  ...glassStyle(C),
                  borderRadius: 14,
                  padding: "12px 14px",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 11,
                    color: C.muted,
                    marginBottom: 5,
                  }}
                >
                  Original language
                </div>

                <div
                  style={{
                    fontFamily: DISPLAY_FONT,
                    fontSize: 17,
                    lineHeight: 1.2,
                    fontWeight: 700,
                    color: C.text,
                    overflowWrap: "anywhere",
                  }}
                >
                  {originalLanguage || "—"}
                </div>
              </div>

              <div
                style={{
                  ...glassStyle(C),
                  borderRadius: 14,
                  padding: "12px 14px",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 11,
                    color: C.muted,
                    marginBottom: 5,
                  }}
                >
                  TMDB rating
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontFamily: DISPLAY_FONT,
                    fontSize: 19,
                    lineHeight: 1.2,
                    fontWeight: 700,
                    color: movie.rating ? "#F5B942" : C.text,
                  }}
                >
                  {movie.rating && (
                    <StarIcon
                      size={16}
                      fill="#F5B942"
                      color="#F5B942"
                    />
                  )}

                  {movie.rating
                    ? `${movie.rating}/10`
                    : "—"}
                </div>
              </div>
            </div>

            {/* Type / Release date */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 10,
                marginTop: 10,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 11,
                    color: C.muted,
                    marginBottom: 4,
                  }}
                >
                  Type
                </div>

                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 13,
                    color: C.text,
                    fontWeight: 600,
                  }}
                >
                  Movie
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 11,
                    color: C.muted,
                    marginBottom: 4,
                  }}
                >
                  Release date
                </div>

                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 13,
                    color: C.text,
                    fontWeight: 600,
                  }}
                >
                  {movie.releaseDate || "—"}
                </div>
              </div>
            </div>

            {/* Dubbed / Country */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 10,
                marginTop: 16,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 11,
                    color: C.muted,
                    marginBottom: 4,
                  }}
                >
                  Dubbed language
                </div>

                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 13,
                    color: C.text,
                    fontWeight: 600,
                    overflowWrap: "anywhere",
                  }}
                >
                  {dubbedLanguages.length
                    ? dubbedLanguages.join(", ")
                    : "—"}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 11,
                    color: C.muted,
                    marginBottom: 4,
                  }}
                >
                  Country
                </div>

                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 13,
                    color: C.text,
                    fontWeight: 600,
                    overflowWrap: "anywhere",
                  }}
                >
                  {movie.originCountries?.length
                    ? movie.originCountries.join(", ")
                    : "—"}
                </div>
              </div>
            </div>

            {/* Director / Music */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 10,
                marginTop: 16,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 11,
                    color: C.muted,
                    marginBottom: 4,
                  }}
                >
                  Director
                </div>

                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 13,
                    color: C.text,
                    fontWeight: 600,
                    overflowWrap: "anywhere",
                  }}
                >
                  {movie.director?.length
                    ? movie.director.join(", ")
                    : "—"}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 11,
                    color: C.muted,
                    marginBottom: 4,
                  }}
                >
                  Music
                </div>

                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 13,
                    color: C.text,
                    fontWeight: 600,
                    overflowWrap: "anywhere",
                  }}
                >
                  {movie.music?.length
                    ? movie.music.join(", ")
                    : "—"}
                </div>
              </div>
            </div>

            {/* Divider ABOVE Genre */}
            <div
              style={{
                height: 1,
                background: C.glassBorder,
                margin: "18px 0 14px",
              }}
            />

            {/* Genre */}
            <div>
              <div
                style={{
                  fontFamily: BODY_FONT,
                  fontSize: 11,
                  color: C.muted,
                  marginBottom: 6,
                }}
              >
                Genre
              </div>

              <div
                style={{
                  fontFamily: BODY_FONT,
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.text,
                  lineHeight: 1.7,
                }}
              >
                {movie.genres?.length
                  ? movie.genres.join(", ")
                  : "—"}
              </div>
            </div>

            {/* Cast */}
            <div style={{ marginTop: 14 }}>
              <div
                style={{
                  fontFamily: BODY_FONT,
                  fontSize: 11,
                  color: C.muted,
                  marginBottom: 6,
                }}
              >
                Cast
              </div>

              <div
                style={{
                  fontFamily: BODY_FONT,
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.text,
                  lineHeight: 1.7,
                }}
              >
                {movie.cast?.length
                  ? movie.cast.map((person) => person.name).join(", ")
                  : "—"}
              </div>
            </div>
          </>
        )}
      </>
    )}

    {/* =====================================================
        TV / SERIES INFORMATION
        ===================================================== */}
    {mediaType === "tv" && (
      <>
        {/* =========================
            TV — DESKTOP
        ========================== */}
        {!isSmallScreen && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 12,
              }}
            >

              {/* CARD 1 — OVERVIEW */}
              <div
                style={{
                  ...glassStyle(C),
                  borderRadius: 14,
                  padding: "14px 16px",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 13,
                    color: C.muted,
                    marginBottom: 10,
                  }}
                >
                  Overview
                </div>

                {[
                  ["Title", movie.title || "—"],

                  [
                    "Seasons",
                    movie.seasons
                      ? `${movie.seasons} ${
                          movie.seasons === 1
                            ? "season"
                            : "seasons"
                        }`
                      : "—",
                  ],

                  [
                    "Original language",
                    originalLanguage || "—",
                  ],

                  [
                    "TMDB rating",
                    movie.rating
                      ? `${movie.rating}/10`
                      : "—",
                  ],
                ].map(([label, value], index, arr) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      padding: "8px 0",
                      borderBottom:
                        index < arr.length - 1
                          ? `1px solid ${C.glassBorder}`
                          : "none",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: BODY_FONT,
                        fontSize: 12,
                        color: C.muted,
                      }}
                    >
                      {label}
                    </span>

                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap:
                          label === "TMDB rating"
                            ? 5
                            : 0,
                        fontFamily: BODY_FONT,
                        fontSize: 13,
                        color:
                          label === "TMDB rating" &&
                          movie.rating
                            ? "#F5B942"
                            : C.text,
                        fontWeight: 600,
                        textAlign: "right",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {label === "TMDB rating" &&
                        movie.rating && (
                          <StarIcon
                            size={14}
                            fill="#F5B942"
                            color="#F5B942"
                          />
                        )}

                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* CARD 2 — SERIES INFORMATION */}
              <div
                style={{
                  ...glassStyle(C),
                  borderRadius: 14,
                  padding: "14px 16px",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 13,
                    color: C.muted,
                    marginBottom: 10,
                  }}
                >
                  Series Information
                </div>

                {[
                  ["Type", "TV Show / Series"],

                  [
                    "First Air Date",
                    movie.releaseDate || "—",
                  ],

                  [
                    "Last Air Date",
                    movie.lastAirDate || "—",
                  ],

                  [
                    "Episodes / Duration",
                    movie.episodes
                      ? `${movie.episodes}${
                          episodeRuntime
                            ? ` / Avg. ${episodeRuntime} min`
                            : ""
                        }`
                      : "—",
                  ],
                ].map(([label, value], index, arr) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      padding: "8px 0",
                      borderBottom:
                        index < arr.length - 1
                          ? `1px solid ${C.glassBorder}`
                          : "none",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: BODY_FONT,
                        fontSize: 12,
                        color: C.muted,
                      }}
                    >
                      {label}
                    </span>

                    <span
                      style={{
                        fontFamily: BODY_FONT,
                        fontSize: 13,
                        color: C.text,
                        fontWeight: 600,
                        textAlign: "right",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* CARD 3 — CREDITS & LANGUAGE */}
              <div
                style={{
                  ...glassStyle(C),
                  borderRadius: 14,
                  padding: "14px 16px",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 13,
                    color: C.muted,
                    marginBottom: 10,
                  }}
                >
                  Credits & Language
                </div>

                {[
                  [
                    "Dubbed language",
                    dubbedLanguages.length
                      ? dubbedLanguages.join(", ")
                      : "—",
                  ],

                  [
                    "Creator",
                    movie.creator?.length
                      ? movie.creator.join(", ")
                      : "—",
                  ],

                  [
                    "Music",
                    movie.music?.length
                      ? movie.music.join(", ")
                      : "—",
                  ],

                  [
                    "Country",
                    movie.originCountries?.length
                      ? movie.originCountries.join(", ")
                      : "—",
                  ],
                ].map(([label, value], index, arr) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      padding: "8px 0",
                      borderBottom:
                        index < arr.length - 1
                          ? `1px solid ${C.glassBorder}`
                          : "none",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: BODY_FONT,
                        fontSize: 12,
                        color: C.muted,
                      }}
                    >
                      {label}
                    </span>

                    <span
                      style={{
                        fontFamily: BODY_FONT,
                        fontSize: 13,
                        color: C.text,
                        fontWeight: 600,
                        textAlign: "right",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* GENRE + CAST */}
            <div
              style={{
                ...glassStyle(C),
                borderRadius: 14,
                padding: "14px 16px",
                marginTop: 12,
              }}
            >
              <div
                style={{
                  fontFamily: BODY_FONT,
                  fontSize: 12,
                  color: C.muted,
                  marginBottom: 7,
                }}
              >
                Genre
              </div>

              <div
                style={{
                  fontFamily: BODY_FONT,
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.text,
                  lineHeight: 1.7,
                }}
              >
                {movie.genres?.length
                  ? movie.genres.join(", ")
                  : "—"}
              </div>

              <div
                style={{
                  fontFamily: BODY_FONT,
                  fontSize: 12,
                  color: C.muted,
                  marginTop: 14,
                  marginBottom: 7,
                }}
              >
                Cast
              </div>

              <div
                style={{
                  fontFamily: BODY_FONT,
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.text,
                  lineHeight: 1.7,
                }}
              >
                {movie.cast?.length
                  ? movie.cast
                      .map((person) => person.name)
                      .join(", ")
                  : "—"}
              </div>
            </div>
          </>
        )}

        {/* =========================
            TV — MOBILE
        ========================== */}
        {isSmallScreen && (
          <>
            {/* Title / Seasons */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: 10,
              }}
            >
              {/* Title */}
              <div
                style={{
                  ...glassStyle(C),
                  borderRadius: 14,
                  padding: "12px 14px",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 11,
                    color: C.muted,
                    marginBottom: 5,
                  }}
                >
                  Title
                </div>

                <div
                  style={{
                    fontFamily: DISPLAY_FONT,
                    fontSize: 18,
                    lineHeight: 1.2,
                    fontWeight: 700,
                    color: C.text,
                    overflowWrap: "anywhere",
                  }}
                >
                  {movie.title || "—"}
                </div>
              </div>

              {/* Seasons */}
              <div
                style={{
                  ...glassStyle(C),
                  borderRadius: 14,
                  padding: "12px 14px",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 11,
                    color: C.muted,
                    marginBottom: 5,
                  }}
                >
                  Seasons
                </div>

                <div
                  style={{
                    fontFamily: DISPLAY_FONT,
                    fontSize: 19,
                    lineHeight: 1.2,
                    fontWeight: 700,
                    color: C.text,
                  }}
                >
                  {movie.seasons
                    ? `${movie.seasons} ${
                        movie.seasons === 1
                          ? "season"
                          : "seasons"
                      }`
                    : "—"}
                </div>
              </div>

              {/* Original Language */}
              <div
                style={{
                  ...glassStyle(C),
                  borderRadius: 14,
                  padding: "12px 14px",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 11,
                    color: C.muted,
                    marginBottom: 5,
                  }}
                >
                  Original language
                </div>

                <div
                  style={{
                    fontFamily: DISPLAY_FONT,
                    fontSize: 17,
                    lineHeight: 1.2,
                    fontWeight: 700,
                    color: C.text,
                    overflowWrap: "anywhere",
                  }}
                >
                  {originalLanguage || "—"}
                </div>
              </div>

              {/* Rating */}
              <div
                style={{
                  ...glassStyle(C),
                  borderRadius: 14,
                  padding: "12px 14px",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 11,
                    color: C.muted,
                    marginBottom: 5,
                  }}
                >
                  TMDB rating
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontFamily: DISPLAY_FONT,
                    fontSize: 19,
                    lineHeight: 1.2,
                    fontWeight: 700,
                    color: movie.rating
                      ? "#F5B942"
                      : C.text,
                  }}
                >
                  {movie.rating && (
                    <StarIcon
                      size={16}
                      fill="#F5B942"
                      color="#F5B942"
                    />
                  )}

                  {movie.rating
                    ? `${movie.rating}/10`
                    : "—"}
                </div>
              </div>
            </div>

            {/* Episodes / Episode Duration */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: 10,
                marginTop: 10,
              }}
            >
              {/* Episodes */}
              <div
                style={{
                  ...glassStyle(C),
                  borderRadius: 14,
                  padding: "12px 14px",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 11,
                    color: C.muted,
                    marginBottom: 5,
                  }}
                >
                  Episodes
                </div>

                <div
                  style={{
                    fontFamily: DISPLAY_FONT,
                    fontSize: 19,
                    lineHeight: 1.2,
                    fontWeight: 700,
                    color: C.text,
                  }}
                >
                  {movie.episodes || "—"}
                </div>
              </div>

              {/* Episode Duration */}
              <div
                style={{
                  ...glassStyle(C),
                  borderRadius: 14,
                  padding: "12px 14px",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 11,
                    color: C.muted,
                    marginBottom: 5,
                  }}
                >
                  Episode Duration
                </div>

                <div
                  style={{
                    fontFamily: DISPLAY_FONT,
                    fontSize: 19,
                    lineHeight: 1.2,
                    fontWeight: 700,
                    color: C.text,
                  }}
                >
                  {episodeRuntime
                    ? `${episodeRuntime} min`
                    : "—"}
                </div>
              </div>
            </div>

            {/* Type / Dubbed Language */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: 10,
                marginTop: 16,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 11,
                    color: C.muted,
                    marginBottom: 4,
                  }}
                >
                  Type
                </div>

                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 13,
                    color: C.text,
                    fontWeight: 600,
                  }}
                >
                  TV Show / Series
                </div>
              </div>

              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 11,
                    color: C.muted,
                    marginBottom: 4,
                  }}
                >
                  Dubbed language
                </div>

                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 13,
                    color: C.text,
                    fontWeight: 600,
                    overflowWrap: "anywhere",
                  }}
                >
                  {dubbedLanguages.length
                    ? dubbedLanguages.join(", ")
                    : "—"}
                </div>
              </div>
            </div>

            {/* First / Last Air Date */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: 10,
                marginTop: 16,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 11,
                    color: C.muted,
                    marginBottom: 4,
                  }}
                >
                  First Air Date
                </div>

                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 13,
                    color: C.text,
                    fontWeight: 600,
                  }}
                >
                  {movie.releaseDate || "—"}
                </div>
              </div>

              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 11,
                    color: C.muted,
                    marginBottom: 4,
                  }}
                >
                  Last Air Date
                </div>

                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 13,
                    color: C.text,
                    fontWeight: 600,
                  }}
                >
                  {movie.lastAirDate || "—"}
                </div>
              </div>
            </div>

            {/* Creator / Music */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: 10,
                marginTop: 16,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 11,
                    color: C.muted,
                    marginBottom: 4,
                  }}
                >
                  Creator
                </div>

                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 13,
                    color: C.text,
                    fontWeight: 600,
                    overflowWrap: "anywhere",
                  }}
                >
                  {movie.creator?.length
                    ? movie.creator.join(", ")
                    : "—"}
                </div>
              </div>

              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 11,
                    color: C.muted,
                    marginBottom: 4,
                  }}
                >
                  Music
                </div>

                <div
                  style={{
                    fontFamily: BODY_FONT,
                    fontSize: 13,
                    color: C.text,
                    fontWeight: 600,
                    overflowWrap: "anywhere",
                  }}
                >
                  {movie.music?.length
                    ? movie.music.join(", ")
                    : "—"}
                </div>
              </div>
            </div>

            {/* Divider ABOVE Genre */}
            <div
              style={{
                height: 1,
                background: C.glassBorder,
                margin: "18px 0 14px",
              }}
            />

            {/* Genre */}
            <div>
              <div
                style={{
                  fontFamily: BODY_FONT,
                  fontSize: 11,
                  color: C.muted,
                  marginBottom: 6,
                }}
              >
                Genre
              </div>

              <div
                style={{
                  fontFamily: BODY_FONT,
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.text,
                  lineHeight: 1.7,
                }}
              >
                {movie.genres?.length
                  ? movie.genres.join(", ")
                  : "—"}
              </div>
            </div>

            {/* Cast — NO divider */}
            <div style={{ marginTop: 14 }}>
              <div
                style={{
                  fontFamily: BODY_FONT,
                  fontSize: 11,
                  color: C.muted,
                  marginBottom: 6,
                }}
              >
                Cast
              </div>

              <div
                style={{
                  fontFamily: BODY_FONT,
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.text,
                  lineHeight: 1.7,
                }}
              >
                {movie.cast?.length
                  ? movie.cast
                      .map((person) => person.name)
                      .join(", ")
                  : "—"}
              </div>
            </div>
          </>
        )}
      </>
    )}
  </div>
</div>

      <div style={{ marginTop: 28, textAlign: "left" }}>
        <h2 style={{ fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: 19, color: C.text, margin: "0 0 12px 0" }}>Cast &amp; crew</h2>
        {movie.cast.length === 0 ? (
          <div style={{ fontFamily: BODY_FONT, fontSize: 12, color: C.muted }}>No cast information available.</div>
        ) : (
          <div className="hide-scrollbar" style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8, justifyContent: "flex-start" }}>
            {movie.cast.map((c) => (
              <div key={c.name} style={{ flexShrink: 0, width: "clamp(85px, 9vw, 130px)", textAlign: "center" }}>
                <div style={{ width: "100%", aspectRatio: "9/16", borderRadius: 10, overflow: "hidden", border: `2px solid ${C.glassBorder}`, background: C.iconBg }}>
                  {c.photo && <img src={c.photo} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                </div>
                <div loading="lazy" style={{ fontFamily: BODY_FONT, fontSize: 11, fontWeight: 600, color: C.text, marginTop: 6 }}>{c.name}</div>
                <div style={{ fontFamily: BODY_FONT, fontSize: 9, color: C.muted, marginTop: 1 }}>{c.role}</div>
              </div>
            ))}
          </div>
        )}

        <h3 style={{ fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: 15, color: C.text, margin: "20px 0 10px 0" }}>Watch trailer &amp; related videos</h3>
        {videos.length === 0 ? (
          <div style={{ fontFamily: BODY_FONT, fontSize: 12, color: C.muted }}>No trailers available for this title yet.</div>
        ) : (
          <div className="hide-scrollbar" style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 8, justifyContent: "flex-start" }}>
            {videos.map((v) => (
              <a key={v.id} href={`https://www.youtube.com/watch?v=${encodeURIComponent(v.key)}`} target="_blank" rel="noopener noreferrer"
                style={{ display: "block", flexShrink: 0, width: "clamp(220px, 26vw, 320px)", borderRadius: 14, overflow: "hidden", textDecoration: "none", position: "relative", boxShadow: "0 10px 26px rgba(0,0,0,0.35)" }}>
                <div style={{ position: "relative", aspectRatio: "16/9" }}>
                  <img src={`https://img.youtube.com/vi/${encodeURIComponent(v.key)}/hqdefault.jpg`} alt={v.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 48, height: 34, borderRadius: 9, background: "#FF0000", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}>
                      <div style={{ width: 0, height: 0, borderTop: "7px solid transparent", borderBottom: "7px solid transparent", borderLeft: "11px solid #fff", marginLeft: 3 }} />
                    </div>
                  </div>
                  <div style={{ position: "absolute", bottom: 8, left: 10, right: 10, fontFamily: BODY_FONT, fontSize: 11, fontWeight: 700, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>{v.name}</div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {related.length > 0 && (
        <div style={{ marginTop: 28, marginBottom: 8, textAlign: "left" }}>
          <h2 style={{ fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: 19, color: C.text, margin: "0 0 12px 0" }}>You might also like</h2>
          <div className="hide-scrollbar" style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 6 }}>
            {related.slice(0, relatedVisible).map((m) => (<div key={`${m.tmdbMediaType}-${m.id}`} style={{ flexShrink: 0, width: "clamp(130px, 15vw, 190px)" }}>
              <PosterCard movie={m} C={C} wishlisted={wishlist.some((w) => w.id === m.id && w.mediaType === m.tmdbMediaType)} onToggleWishlist={onToggleWishlist} ownedProviderIds={ownedProviderIds} /></div>))}
          
          {/* Load More */}
          {relatedVisible < Math.min(related.length, 50) && (
            <div
              style={{
                flexShrink: 0,
                width: "clamp(130px, 15vw, 190px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              >
              <button
                onClick={() =>
                  setRelatedVisible((prev) => Math.min(prev + 10, 50))
                }
                style={{
                  padding: "9px 18px",
                  borderRadius: 999,
                  border: `1px solid ${C.glassBorder}`,
                  background: C.glass,
                  color: C.text,
                  cursor: "pointer",
                  fontFamily: BODY_FONT,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Load More
              </button>
            </div>
          )}
        </div>
        </div>
      )}
      
    </div>
  );
}


