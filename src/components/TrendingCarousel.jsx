import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Star as StarIcon } from "lucide-react";
import { glassStyle, DISPLAY_FONT, BODY_FONT } from "../styles/theme";
import { Sheen } from "./Primitives";

const AUTOPLAY_MS = 5000;

// `movies` should already be the list you want shown, in order (e.g. now-playing).
export default function TrendingCarousel({ movies, C }) {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const timerRef = useRef(null);

  useEffect(() => {
    if (movies.length <= 1) return;
    timerRef.current = setInterval(() => setIndex((i) => (i === movies.length - 1 ? 0 : i + 1)), AUTOPLAY_MS);
    return () => clearInterval(timerRef.current);
  }, [movies.length]);

  if (movies.length === 0) return null;
  const movie = movies[Math.min(index, movies.length - 1)];
  const mediaType = movie.tmdbMediaType || movie.type || "movie";

  const restartTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setIndex((i) => (i === movies.length - 1 ? 0 : i + 1)), AUTOPLAY_MS);
  };
  const prev = () => { setIndex((i) => (i === 0 ? movies.length - 1 : i - 1)); restartTimer(); };
  const next = () => { setIndex((i) => (i === movies.length - 1 ? 0 : i + 1)); restartTimer(); };

  const arrowStyle = { position: "absolute", top: "50%", transform: "translateY(-50%)", width: 44, height: 44, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.5)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 5 };

  return (
    <div style={{ marginBottom: 30 }}>
      <h3 style={{ fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: 17, color: C.text, margin: "0 0 12px 0" }}>Latest Releases</h3>
      <div style={{ position: "relative", width: "100%", borderRadius: 20, ...glassStyle(C, { padding: 0, cursor: "pointer" }) }} onClick={() => navigate(`/title/${mediaType}/${movie.id}`)}>
        <Sheen C={C} />
        <button onClick={(e) => { e.stopPropagation(); prev(); }} style={{ ...arrowStyle, left: 14 }}><ChevronLeft size={22} /></button>
        <button onClick={(e) => { e.stopPropagation(); next(); }} style={{ ...arrowStyle, right: 14 }}><ChevronRight size={22} /></button>
        <div style={{ position: "relative", width: "100%", aspectRatio: "21/9", minHeight: 220, overflow: "hidden", borderRadius: 20 }}>
          {movie.backdrop ? (
            <img src={movie.backdrop} alt={movie.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", background: C.iconBg }} />
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0) 100%)" }} />
          <div style={{ position: "absolute", bottom: 20, left: 26, right: 26 }}>
            <div style={{ fontFamily: DISPLAY_FONT, fontWeight: 800, fontSize: 26, color: "#fff" }}>{movie.title}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
              <span style={{ fontFamily: BODY_FONT, fontSize: 13, color: "rgba(255,255,255,0.85)" }}>{movie.year}</span>
              <span style={{ fontFamily: BODY_FONT, fontSize: 13, color: "rgba(255,255,255,0.85)" }}>{movie.genres.join(", ")}</span>
              <StarIcon size={13} fill="#F5B942" color="#F5B942" />
              <span style={{ fontFamily: BODY_FONT, fontSize: 13, color: "#F5B942", fontWeight: 700 }}>{movie.rating}</span>
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10 }}>
        {movies.map((m, i) => (
          <div key={`${m.tmdbMediaType}-${m.id}`} onClick={() => { setIndex(i); restartTimer(); }} style={{ width: i === index ? 18 : 6, height: 6, borderRadius: 999, background: i === index ? C.coralSolid : C.iconBg, cursor: "pointer", transition: "width 0.2s ease" }} />
        ))}
      </div>
    </div>
  );
}
