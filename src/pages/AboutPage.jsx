import React from "react";
import { glassStyle, DISPLAY_FONT, BODY_FONT } from "../styles/theme";
import { Sheen } from "../components/Primitives";

export default function AboutPage({ C }) {
  const p = { position: "relative", fontFamily: BODY_FONT, fontSize: 14, lineHeight: 1.7, color: C.text, margin: "0 0 12px 0" };
  const small = { ...p, fontSize: 12, color: C.muted, lineHeight: 1.6 };
  const link = { color: C.coralSolid, textDecoration: "none", fontWeight: 600 };
  const ext = { target: "_blank", rel: "noopener noreferrer" };

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", ...glassStyle(C, { padding: 26, borderRadius: 18 }) }}>
      <Sheen C={C} />
      <h1 style={{ position: "relative", fontFamily: DISPLAY_FONT, fontWeight: 800, fontSize: 22, color: C.text, margin: "0 0 12px 0" }}>About Where To Watch</h1>
      <p style={p}>
        Where To Watch helps you find which streaming platform has the movie or show you're looking for.
        Search a title, pick your country, and see where it's streaming, rented, or bought. Add the
        platforms you pay for and we'll point out when a title is already covered.
      </p>


      <h2 style={{ position: "relative", fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: 16, color: C.text, margin: "20px 0 10px 0" }}>Credits</h2>

      <a href="https://www.themoviedb.org/" {...ext} style={{ position: "relative", display: "inline-block", marginBottom: 10 }}>
        <img src="/tmdb-logo.svg" alt="TMDB" style={{ height: 14, display: "block" }} />
      </a>
      <p style={small}>
        This product uses the TMDB API but is not endorsed or certified by TMDB. Movie and TV metadata
        and images are provided by <a href="https://www.themoviedb.org/" {...ext} style={link}>The Movie Database (TMDB)</a>.
      </p>
      <p style={small}>
        Where-to-watch provider data is provided by <a href="https://www.justwatch.com/" {...ext} style={link}>JustWatch</a>.
      </p>
      <p style={small}>
        Streaming availability information, including audio languages, is provided by{" "}
        <a href="https://www.movieofthenight.com/about/api" {...ext} style={link}>Streaming Availability API by Movie of the Night</a>.
      </p>
      <p style={small}>
        Streaming service names and logos belong to their respective owners. Where To Watch is not
        affiliated with, or endorsed by, any streaming service.
      </p>
    </div>
  );
}
