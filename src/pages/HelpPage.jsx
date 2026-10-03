import React from "react";
import { glassStyle, DISPLAY_FONT, BODY_FONT } from "../styles/theme";
import { Sheen } from "../components/Primitives";

const FAQS = [
  { q: "Why can't I find a specific movie?", a: "Search covers The Movie Database (TMDB). Check the spelling or try the exact title. Very new or niche titles may not be listed yet." },
  { q: "How does regional availability work?", a: "Select your country on a title's page to see where it can be streamed, rented, or bought in that country." },
  { q: "What does adding a platform in My OTT do?", a: "It marks titles that are available on platforms you already have, so you can see at a glance what you can watch." },
  { q: "Is my data saved?", a: "Your country, wishlist and platforms are saved in this browser only. They won't carry over to other devices or browsers, and clearing your browser data removes them." },
];

export default function HelpPage({ C }) {
  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <h1 style={{ fontFamily: DISPLAY_FONT, fontWeight: 800, fontSize: 22, color: C.text, margin: "0 0 18px 0" }}>Help &amp; FAQ</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {FAQS.map((item) => (
          <div key={item.q} style={{ ...glassStyle(C, { padding: 16, borderRadius: 14 }) }}>
            <Sheen C={C} />
            <div style={{ position: "relative", fontFamily: BODY_FONT, fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 6 }}>{item.q}</div>
            <div style={{ position: "relative", fontFamily: BODY_FONT, fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{item.a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
