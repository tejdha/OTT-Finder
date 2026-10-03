// LEGACY / DEMO DATA — no longer imported by any page.
// The app now fetches everything live from TMDB (see src/api/tmdb.js and
// src/api/adapters.js). This file is kept only as a reference for the shape
// the mock prototype originally used, and can be deleted once you're
// confident the live version covers everything you need.

export const PROVIDER_URLS_IN = {
  8: "https://www.netflix.com/in/",
  119: "https://www.primevideo.com/",
  350: "https://tv.apple.com/in/",
  2336: "https://www.hotstar.com/in/",
  283: "https://www.crunchyroll.com/",
  232: "https://www.zee5.com/",
  237: "https://www.sonyliv.com/",
  192: "https://www.youtube.com/movies",
  309: "https://www.sunnxt.com/",
  515: "https://www.mxplayer.in/",
  532: "https://www.aha.video/",
  561: "https://www.lionsgateplay.com/",
  2100: "https://www.primevideo.com/",
};



// export const PRICING = {
//   netflix: "\u20b9199/mo",
//   prime: "\u20b9299/mo",
//   hotstar: "\u20b9149/mo",
//   appletv: "\u20b9149 rent",
//   youtube: "\u20b999 rent",
// };

export const NOTIFICATIONS = [
  { id: 1, text: "Neon Horizon just came to Netflix", time: "2h ago" },
  { id: 2, text: "Price drop: Iron Season rent is now \u20b999", time: "1d ago" },
  { id: 3, text: "New this week: Deep Fathom", time: "3d ago" },
];

export const ALL_COUNTRIES = ["India", "United States", "United Kingdom", "Canada", "Australia"];

// Derives Free / Subscription / Rent from the PRICING string.
// NOTE: no provider in this mock catalog is marked "Free" yet — add one to
// PRICING (e.g. "Free" as the string) once real data includes a free tier.
// export function getPriceType(providerId) {
//   const price = PRICING[providerId] || "";
//   if (price.toLowerCase().includes("rent")) return "rent";
//   if (price.toLowerCase() === "free") return "free";
//   return "subscription";
// }

// export const MOVIES = [
//   { id: 1, title: "Neon Horizon", type: "movie", year: 2024, rating: 8.2, runtime: "2h 8m", genres: ["Sci-Fi", "Thriller"],
//     poster: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=80", backdrop: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200&q=80",
//     overview: "In a city where memories can be traded like currency, a detective who has sold too much of his own past must solve one final case before he forgets who he is entirely.",
//     country: "India", providers: ["netflix", "prime"],
//     cast: [{ name: "Arjun Verma", role: "Detective Rao", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80" },
//       { name: "Leah Osei", role: "Mira Chen", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&q=80" },
//       { name: "Tom Bridges", role: "The Broker", photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&q=80" }] },
//   { id: 2, title: "The Last Monsoon", type: "tv", year: 2023, rating: 7.6, runtime: "1h 54m", genres: ["Drama"],
//     poster: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=400&q=80", backdrop: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=80",
//     overview: "Three siblings return to their family's coastal home as the rains close in, forced to confront the inheritance dispute that scattered them a decade ago.",
//     country: "India", providers: ["hotstar", "youtube"],
//     cast: [{ name: "Priya Nair", role: "Meera", photo: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=300&q=80" },
//       { name: "Dev Kapoor", role: "Vikram", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&q=80" }] },
//   { id: 3, title: "Static", type: "movie", year: 2025, rating: 6.9, runtime: "1h 41m", genres: ["Horror"],
//     poster: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&q=80", backdrop: "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=1200&q=80",
//     overview: "A late-night radio host starts receiving calls from a station that went off-air thirty years ago \u2014 and the voices know things no one alive should know.",
//     country: "United States", providers: ["appletv", "prime"],
//     cast: [{ name: "Grace Holloway", role: "Nadia", photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&q=80" }] },
//   { id: 4, title: "Iron Season", type: "movie", year: 2022, rating: 8.8, runtime: "2h 21m", genres: ["Action", "Drama"],
//     poster: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&q=80", backdrop: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200&q=80",
//     overview: "A steel town's championship boxing gym faces closure, and its aging trainer has one last fighter left to make it count.",
//     country: "India", providers: ["netflix", "hotstar", "youtube"],
//     cast: [{ name: "Farhan Iqbal", role: "Coach Rasheed", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&q=80" },
//       { name: "Simone Alves", role: "Jyoti", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&q=80" }] },
//   { id: 5, title: "Paper Kites", type: "movie", year: 2021, rating: 7.1, runtime: "1h 38m", genres: ["Comedy", "Romance"],
//     poster: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=400&q=80", backdrop: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=80",
//     overview: "Two rival kite-shop owners in old Ahmedabad are forced into a business partnership right before the city's biggest festival.",
//     country: "India", providers: ["prime"],
//     cast: [{ name: "Aditi Rao", role: "Kavya", photo: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=300&q=80" },
//       { name: "Rohan Mehta", role: "Zaid", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80" }] },
//   { id: 6, title: "Deep Fathom", type: "movie", year: 2024, rating: 7.9, runtime: "2h 2m", genres: ["Adventure", "Sci-Fi"],
//     poster: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=80", backdrop: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200&q=80",
//     overview: "A salvage crew discovers a structure at the bottom of the Mariana Trench that shouldn't exist \u2014 and it's still transmitting.",
//     country: "United States", providers: ["netflix", "appletv"],
//     cast: [{ name: "Marcus Webb", role: "Captain Ilse", photo: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&q=80" },
//       { name: "Noor Fathi", role: "Dr. Kade", photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&q=80" }] },
//   { id: 7, title: "Signal Loss", type: "webseries", year: 2024, rating: 8.4, runtime: "8 episodes", genres: ["Thriller"],
//     poster: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&q=80", backdrop: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200&q=80",
//     overview: "A cybersecurity analyst uncovers a conspiracy buried inside her own company's server logs.",
//     country: "India", providers: ["netflix"],
//     cast: [{ name: "Riya Sen", role: "Ananya", photo: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=300&q=80" }] },
//   { id: 8, title: "Half Light", type: "webseries", year: 2023, rating: 7.8, runtime: "6 episodes", genres: ["Drama", "Mystery"],
//     poster: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&q=80", backdrop: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=80",
//     overview: "A small-town lawyer reopens a decades-old missing person case that everyone else wants left alone.",
//     country: "United States", providers: ["prime", "appletv"],
//     cast: [{ name: "Owen Blake", role: "Cal Ferris", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80" }] },
// ];
