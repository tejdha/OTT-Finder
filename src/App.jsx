import React, { useLayoutEffect, useRef, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, Link } from "react-router-dom";
import { THEMES, FONT_IMPORT_URL, BODY_FONT, GLOBAL_CSS, CONTENT_MAX_WIDTH, } from "./styles/theme";
import { toIsoRegion } from "./api/regions";
import Header from "./components/Header";
import Tabs from "./components/Tabs";
import HomePage from "./pages/HomePage";
import WishlistPage from "./pages/WishlistPage";
import MyOttPage from "./pages/MyOttPage";
import MovieDetailPage from "./pages/MovieDetailPage";
import PlatformPage from "./pages/PlatformPage";
import SeeAllPage from "./pages/SeeAllPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import AboutPage from "./pages/AboutPage";
import HelpPage from "./pages/HelpPage";
import FeedbackPage from "./pages/FeedbackPage";

import RegionOnboarding from "./components/RegionOnboarding";

import NotFoundPage from "./pages/notfoundpage";


// Pages that show the Home/Wishlist/My OTT tab bar
const TABBED_PATHS = ["/", "/wishlist", "/my-ott","/dashboard","/settings", "/about","/help","/feedback"];

const STORAGE_VERSION = 1;

function loadStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed?.v !== STORAGE_VERSION) return fallback;
    return parsed.data;
  } catch {
    return fallback; // corrupted or blocked storage: start empty
  }
}

function saveStored(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ v: STORAGE_VERSION, data }));
  } catch {
    // storage full or blocked: the app keeps working in memory
  }
}

// Only accept data in exactly the shape the app expects.
function cleanWishlist(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((w) => w && Number.isInteger(w.id) && (w.mediaType === "movie" || w.mediaType === "tv"))
    .map((w) => ({ id: w.id, mediaType: w.mediaType }));
}

function cleanIds(value) {
  return Array.isArray(value) ? value.filter(Number.isInteger) : [];
}

export default function App() {
  const [theme, setTheme] = useState(() => {
  return localStorage.getItem("theme") || "dark";
});
  const C = THEMES[theme];

  useEffect(() => {
  document.body.style.background = C.bgGradient;
  document.body.style.margin = "0";

  return () => {
    document.body.style.background = "";
    document.body.style.margin = "";
  };
}, [C.bgGradient]);
  // wishlist entries are { id, mediaType } — a bare numeric id isn't unique
  // across TMDB's movie vs tv id spaces, so we need both.
  const [wishlist, setWishlist] = useState(() => cleanWishlist(loadStored("wishlist", [])));
  // ownedProviderIds holds TMDB's own numeric watch-provider ids now
  // (real platforms, not the old 5 hardcoded string keys).
  const [ownedProviderIds, setOwnedProviderIds] = useState(() => cleanIds(loadStored("ownedProviderIds", [])));
  
  useEffect(() => { saveStored("wishlist", wishlist); }, [wishlist]);
useEffect(() => { saveStored("ownedProviderIds", ownedProviderIds); }, [ownedProviderIds]);

  const [query, setQuery] = useState("");

  const [userCountry, setUserCountry] = useState(() => {
  return localStorage.getItem("userCountry") || null;
  });

  const [homeCountry, setHomeCountry] = useState(() => {
  return localStorage.getItem("userCountry") || null;
});

useEffect(() => {
  setHomeCountry(userCountry || null);
}, [userCountry]);

  const [regionOnboardingDismissed, setRegionOnboardingDismissed] = useState(
  () => localStorage.getItem("regionOnboardingDismissed") === "true"
  );

  const [locating, setLocating] = useState(false);
  const [user, setUser] = useState(null);

  const [platformTabs, setPlatformTabs] = useState({});

  const watchRegion = toIsoRegion(userCountry);

  const showRegionOnboarding =
  !userCountry && !regionOnboardingDismissed;

  const dismissRegionOnboarding = () => {
  setRegionOnboardingDismissed(true);
  localStorage.setItem("regionOnboardingDismissed", "true");
  };

  const updateUserCountry = (country) => {
  setUserCountry(country);

  if (country) {
    localStorage.setItem("userCountry", country);
  } else {
    localStorage.removeItem("userCountry");
  }
  };

  const toggleTheme = () => {
  setTheme((t) => {
    const nextTheme = t === "dark" ? "light" : "dark";
    localStorage.setItem("theme", nextTheme);
    return nextTheme;
  });
};
  const toggleWishlist = (ref) =>
    setWishlist((prev) =>
      prev.some((w) => w.id === ref.id && w.mediaType === ref.mediaType)
        ? prev.filter((w) => !(w.id === ref.id && w.mediaType === ref.mediaType))
        : [...prev, ref]
    );
  const toggleOwnedProvider = (id) => setOwnedProviderIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`);
          const data = await res.json();
          updateUserCountry(data.countryName || null);
        } catch (e) {
          updateUserCountry(null);
        }
        setLocating(false);
      },
      () => setLocating(false)
    );
  };


  return (
    <BrowserRouter>
    <ScrollManager />
    {showRegionOnboarding && (
      <RegionOnboarding
        C={C}
        onSelectCountry={updateUserCountry}
        onDetectLocation={detectLocation}
        locating={locating}
        onClose={dismissRegionOnboarding}
      />
      )}
      <div style={{ background: C.bgGradient, minHeight: "100vh", fontFamily: BODY_FONT, transition: "background 0.3s ease" }}>
        <style>{`@import url('${FONT_IMPORT_URL}'); ${GLOBAL_CSS}`}</style>
        <StickyNavigation C={C} theme={theme} onToggleTheme={toggleTheme} query={query} onQueryChange={setQuery} userCountry={userCountry} onManualCountry={updateUserCountry}/>
    
        <div style={{position: "relative", zIndex: 1, padding: "0 24px 80px" }}>
          <AppRoutes
            C={C}
            platformTabs={platformTabs}
            setPlatformTabs={setPlatformTabs}
            theme={theme}
            onToggleTheme={toggleTheme}
            query={query}
            onQueryChange={setQuery}
            wishlist={wishlist}
            onToggleWishlist={toggleWishlist}
            ownedProviderIds={ownedProviderIds}
            onToggleOwnedProvider={toggleOwnedProvider}
            userCountry={userCountry}
            watchRegion={watchRegion}
            homeCountry={homeCountry}
            onHomeCountryChange={setHomeCountry}
            onManualCountry={updateUserCountry}
            onDetectLocation={detectLocation}
            locating={locating}
            user={user}
            onLogin={setUser}
            onUpdateUser={(patch) => setUser((u) => ({ ...(u || {}), ...patch }))}
          />
          <div style={{ textAlign: "center", marginTop: 40, fontSize: 11, color: C.muted, fontFamily: BODY_FONT }}>
            Data from TMDB, JustWatch and Movie of the Night · <Link to="/about" style={{ color: C.muted }}>Credits</Link>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

function StickyNavigation({ C, theme, onToggleTheme, query, onQueryChange, userCountry, onManualCountry }) {
  const location = useLocation();
  const navRef = useRef(null);

  const showTabs = TABBED_PATHS.includes(location.pathname);

  useLayoutEffect(() => {
    if (!navRef.current) return;

    const updateHeight = () => {
      const height = navRef.current.getBoundingClientRect().height;

      document.documentElement.style.setProperty(
        "--sticky-nav-height",
        `${height}px`
      );
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(navRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [showTabs, theme]);

  return (
      <div ref={navRef} style={{position: "sticky", top : 0, zIndex: 100, background: "transparent", }}>
        <div style={{
          position: "relative",
          zIndex: 2,
          background: "rgba(10, 10, 14, 0.35)",
          // backdropFilter: "blur(3px)",
          // WebkitBackdropFilter: "blur(12px)",
          padding: "24px 24px 0",}}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              backdropFilter: "blur(2px)",
              WebkitBackdropFilter: "blur(12px)",
              pointerEvents: "none",
            }}
            />
          <Header 
            C={C}
            theme={theme}
            onToggleTheme={onToggleTheme} 
            query={query} 
            onQueryChange={onQueryChange} 
            showSearch={showTabs}
            userCountry={userCountry}
            onManualCountry={onManualCountry}
            />
        </div>        

        {showTabs && (
          <div style={{
            position: "relative",
            zIndex: 1,
            background: "transparent",
            paddingTop: 2,}}>
            <Tabs C={C} />
          </div>
        )}
      </div>
  );
}

function ScrollManager() {
  const location = useLocation();

  useEffect(() => {
    const savedScroll = sessionStorage.getItem(
      "ott-home-scroll-position"
    );

    if (location.pathname !== "/" || savedScroll === null) {
      return;
    }

    let attempts = 0;

    const restore = () => {
      attempts += 1;

      const target = Number(savedScroll);

      if (document.documentElement.scrollHeight >= target + window.innerHeight) {
        window.scrollTo(0, target);
        sessionStorage.removeItem("ott-home-scroll-position");
        return;
      }

      if (attempts < 20) {
        requestAnimationFrame(restore);
      }
    };

    requestAnimationFrame(restore);
  }, [location.pathname]);

  return null;
}

function AppRoutes(props){
  const {C, platformTabs, setPlatformTabs } = props;

  return (
    <div style={{width: "95%" , maxWidth: "none", margin : "0 auto",}}>

      <Routes>
        <Route path="/" element={<HomePage C={C} wishlist={props.wishlist} onToggleWishlist={props.onToggleWishlist} ownedProviderIds={props.ownedProviderIds} userCountry={props.userCountry} watchRegion={props.watchRegion} query={props.query} onQueryChange={props.onQueryChange} platformTabs={platformTabs} setPlatformTabs={setPlatformTabs} homeCountry={props.homeCountry} onHomeCountryChange={props.onHomeCountryChange}/>} />
        <Route path="/wishlist" element={<WishlistPage C={C} wishlist={props.wishlist} onToggleWishlist={props.onToggleWishlist} ownedProviderIds={props.ownedProviderIds} watchRegion={props.watchRegion} />} />
        <Route path="/my-ott" element={<MyOttPage C={C} owned={props.ownedProviderIds} onToggle={props.onToggleOwnedProvider} wishlist={props.wishlist} onToggleWishlist={props.onToggleWishlist} onDetectLocation={props.onDetectLocation} userCountry={props.userCountry} onManualCountry={props.onManualCountry} locating={props.locating} watchRegion={props.watchRegion} />} />
        <Route path="/title/:mediaType/:id" element={<MovieDetailPage C={C} wishlist={props.wishlist} onToggleWishlist={props.onToggleWishlist} ownedProviderIds={props.ownedProviderIds} userCountry={props.userCountry} onManualCountry={props.onManualCountry} />} />
        <Route path="/platform/:id" element={<PlatformPage C={C} wishlist={props.wishlist} onToggleWishlist={props.onToggleWishlist} ownedProviderIds={props.ownedProviderIds} watchRegion={props.watchRegion} userCountry={props.userCountry} onManualCountry={props.onManualCountry} homeCountry={props.homeCountry}/>} />
        <Route path="/see-all" element={<SeeAllPage C={C} wishlist={props.wishlist} onToggleWishlist={props.onToggleWishlist} ownedProviderIds={props.ownedProviderIds} />} />
        <Route path="/login" element={<LoginPage C={C} onLogin={props.onLogin} />} />
        <Route path="/signup" element={<SignupPage C={C} onLogin={props.onLogin} />} />
        <Route path="/dashboard" element={<DashboardPage C={C} wishlist={props.wishlist} ownedProviderIds={props.ownedProviderIds} watchRegion={props.watchRegion} user={props.user} userCountry={props.userCountry} onManualCountry={props.onManualCountry}/>} />
        <Route path="/profile" element={<ProfilePage C={C} user={props.user} onUpdateUser={props.onUpdateUser} />} />
        <Route path="/settings" element={<SettingsPage C={C} theme={props.theme} onToggleTheme={props.onToggleTheme} />} />
        <Route path="/about" element={<AboutPage C={C} />} />
        <Route path="/help" element={<HelpPage C={C} />} />
        <Route path="/feedback" element={<FeedbackPage C={C} />} />
        <Route path="*" element={<NotFoundPage C={C} />} />
      </Routes>
    </div>
  );
}



