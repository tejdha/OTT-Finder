# Where To Watch

Search a movie or show, see which platform has it, and get a personalized
"you already have this" indicator based on the platforms you select in My OTT.
Now running on **live TMDB data**.

## Getting started

1. Get a TMDB API Read Access Token (v4 auth): https://www.themoviedb.org/settings/api
2. Copy the env template and paste your token in:
   ```bash
   cp .env.example .env
   # edit .env, set VITE_TMDB_TOKEN=your_token
   ```
3. Install and run:
   ```bash
   npm install
   npm run dev
   ```
4. Open the local URL Vite prints (usually http://localhost:5173).

## Project structure

```
src/
  main.jsx              Entry point
  App.jsx               Routing + top-level state (theme, wishlist, owned platform ids, user, region)
  api/
    tmdb.js               Low-level TMDB client: fetch wrapper, image URL helpers, all endpoint functions
    adapters.js            Converts raw TMDB responses into the shape components expect
    regions.js              Country name <-> ISO 3166-1 code mapping (TMDB needs ISO codes)
    movieCache.js            In-memory cache of every item seen this session, keyed by {mediaType, id} —
                             lets Wishlist/See All show full details without a duplicate fetch
  styles/
    theme.js               Color themes, fonts, shared glass-card style helper
  components/
    Primitives.jsx          Sheen, IconButton, useOutsideClose hook
    Header.jsx               Top bar: logo, notifications, theme toggle, profile, menu (Settings lives here now)
    Tabs.jsx                  Home / Wishlist / My OTT nav
    SearchAndFilters.jsx       Search bar, multi-select filter dropdown, sort dropdown
    Cards.jsx                  PosterCard, ProviderIcon (real logos), ProviderPill
    Sections.jsx                 Row, PlatformSection (live per-platform discover), GenreSection (live per-genre discover)
    PlatformLogosRow.jsx           Live list of real platforms available in the current region
    TrendingCarousel.jsx            Auto-advancing hero carousel (fed whatever list a page passes in)
  pages/
    HomePage.jsx            Search, filters, carousel, weekly trending rows, live platform sections, genre sections
    WishlistPage.jsx          Reads full details from the session cache (see movieCache.js note below)
    MyOttPage.jsx               Live platform picker + personalized per-platform sections
    MovieDetailPage.jsx          Hero, region-aware Free/Subscription/Rent tabs, overview, cast, real trailers, recommendations
    PlatformPage.jsx               Dedicated page per platform: latest/top10/top-rated/genre sections, its own search+filters
    SeeAllPage.jsx                   Expanded grid for any "See all" link
    LoginPage.jsx / SignupPage.jsx     Mock auth forms (no backend wired up yet)
    DashboardPage.jsx                   Wishlist/platform stats + quick links
    ProfilePage.jsx                       Edit name/email (in-memory only)
    SettingsPage.jsx                       Theme toggle + placeholder preference toggles
    AboutPage.jsx / HelpPage.jsx / FeedbackPage.jsx
  data/
    movies.js              LEGACY — the original mock catalog, no longer imported anywhere. Kept for reference only.
```

## How live data flows

1. **List endpoints** (search, trending, discover, popular, top rated) return light objects —
   title, poster, rating, genre *ids*. `adaptListResponse()` turns these into the app's
   internal shape, but `providers`, `cast`, and `runtime` are empty until you open the detail page.
2. **The detail endpoint** (`getDetails`) uses `append_to_response=credits,videos,watch/providers`
   to get everything in one call, and `adaptDetails()` fills in the rest — including real
   watch-provider logos, grouped by `flatrate` (subscription) / `rent` / `buy` / `free` / `ads`.
3. **`movieCache.js`** remembers every item any page has fully or partially fetched this
   session, keyed by `{mediaType, id}`. Wishlist and "you might also like" pull from this
   cache rather than re-fetching — so a wishlisted item won't show its platform chips until
   you've actually opened its detail page at least once this session. A v2 improvement would
   persist wishlist refs and re-fetch details on load instead of relying on the cache.
4. **Region** — `userCountry` (a display name like "India") is converted to an ISO code via
   `regions.js` and passed to TMDB as `watch_region`. The manual dropdown on the movie detail
   page and the "enable location" button in My OTT both set the same `userCountry` state.

## Known limitations / what to improve next

- **"Trending" / "popular" / "top rated"** now use TMDB's own real signals — no more fake
  rating-based stand-ins.
- **Genre sections fetch live**, so Home's full list of genre rows now means one `discover`
  call per genre on load — fine within TMDB's rate limits (~40-50 req/10s) but worth paginating
  or lazy-loading (e.g. only fetch a genre section once it scrolls into view) before a heavy
  production launch.
- **Searching *within* a platform page** can't ask TMDB for "this text AND this provider" in
  one call — TMDB's search endpoint doesn't support a provider filter. The current approach
  discovers that platform's catalog (sorted/filtered server-side) and matches the title
  client-side against whatever page came back, so it won't search the platform's entire
  catalog — just what's been fetched.
- **Wishlist persistence** is in-memory only and resets on refresh, same as owned platforms,
  theme, and the mock user. Add localStorage or a real backend when ready.
- **Login/Signup** don't call any backend — `onLogin` just stores a user object in memory.
- **TMDB attribution**: their terms require showing "This product uses the TMDB API but is
  not endorsed or certified by TMDB" plus their logo somewhere visible — this isn't in the UI
  yet, add it (e.g. a footer) before deploying publicly.
- **Rate limiting / caching in production**: the in-memory `Map` cache in `tmdb.js` resets on
  reload. For a real deployment, consider a small server-side cache/proxy so repeated visitors
  don't all hit TMDB directly with the same queries.

## Deployment

This is a static Vite app — `npm run build` produces a `dist/` folder deployable to Vercel,
Netlify, GitHub Pages, or any static host. Set `VITE_TMDB_TOKEN` as an environment variable in
your hosting provider's dashboard (not committed to the repo) — Vite bakes `VITE_`-prefixed
vars into the client bundle at build time, which is expected for TMDB's read token.
