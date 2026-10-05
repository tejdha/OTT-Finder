import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Sun, Moon, User, Menu, X, LayoutDashboard, LogOut } from "lucide-react";
import { glassStyle, DISPLAY_FONT, BODY_FONT, CONTENT_MAX_WIDTH } from "../styles/theme";
import { NOTIFICATIONS } from "../data/movies";
import { Sheen, IconButton, useOutsideClose } from "./Primitives";

import useScrollDirection from "../hooks/useScrollDirection";
import { SearchBar } from "./SearchAndFilters";
import RegionSelect from "./RegionSelect";

export default function Header({ C, theme, onToggleTheme, query, onQueryChange, showSearch=true, userCountry, onManualCountry,  }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(() => window.innerWidth >= 768 && window.innerWidth < 1100);

useEffect(() => {
  const handleResize = () => {
    setIsMobile(window.innerWidth < 768);
    setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1100);
  };

  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);
  
  const {direction, isAtTop} = useScrollDirection();
  const showHeaderSearch = !isAtTop && direction === "up";

  const notifRef = useRef(null), profileRef = useRef(null), menuRef = useRef(null);

  const navigate = useNavigate();
  useOutsideClose(notifRef, () => setNotifOpen(false));
  useOutsideClose(profileRef, () => setProfileOpen(false));
  useOutsideClose(menuRef, () => setMenuOpen(false));


  const dropdownStyle = { ...glassStyle(C), position: "absolute", right: 0, top: 70, width: 250, borderRadius: 18, padding: 10, fontFamily: BODY_FONT };
  const rowStyle = { position: "relative", display: "flex", alignItems: "center", gap: 10, padding: "10px 10px", borderRadius: 12, color: C.text, fontWeight: 600 ,fontSize: 13, cursor: "pointer" };

  return (
    <div style={{ position: "relative", zIndex: 100, // Header slides away when scrolling down.
    }}>
      <div
  style={{
    display: "grid",
    gridTemplateColumns: isTablet
    ? "auto minmax(170px, 1fr) auto" 
    :"minmax(0, 1fr) auto minmax(0, 1fr)",
    alignItems: "center",
    width: "95%",
    margin: "0 auto",
    padding: "0 0 22px 0",
  }}
>
  {/* LEFT — BRAND */}
  <Link
    to="/"
    style={{
      textDecoration: "none",
      justifySelf: "start" 
    }}
  >
    <div
      style={{
        fontFamily: DISPLAY_FONT,
        fontWeight: 800,
        fontSize: 22,
        color: C.coralSolid,
        whiteSpace: "nowrap",
      }}
    >
      Where To Watch
    </div>
  </Link>

  {/* CENTER — SEARCH */}
  <div
  style={{
    minWidth: "100%",
    display: "flex",
    justifyContent:  "center",
  }}
>
  {showSearch && showHeaderSearch && (
    <div
      style={{
        width: isTablet 
        ? "clamp(250px, 20vw, 280px)"
        : "clamp(170px, 25vw, 400px)",
        justifySelf: isTablet ? "start" : "center"
      }}
    >
      <SearchBar
        value={query}
        onChange={onQueryChange}
        C={C}
      />
    </div>
  )}
</div>

  {/* RIGHT — COUNTRY + CONTROLS */}
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      justifySelf: "end",
    }}
  >
  
      {!isMobile && (
        // <div
        //   // style={{
        //   //   width: 180,
        //   //   flexShrink: 0,
        //   //   marginRight: 2,
        //   // }}
        // >
          <RegionSelect
            selectedCountryName={userCountry}
            onManualSelect={onManualCountry}
            C={C}
          />
        // </div>
      )}


    <div style={{ position: "relative" }} ref={notifRef}>
      <IconButton
        C={C}
        badge
        onClick={() => setNotifOpen((v) => !v)}
      >
        <Bell size={17} />
      </IconButton>

      {notifOpen && (
        <div style={dropdownStyle}>
          <Sheen C={C} />

          <div
            style={{
              position: "relative",
              fontSize: 12,
              color: C.muted,
              padding: "6px 8px",
              fontWeight: 600,
            }}
          >
            Notifications
          </div>

          {NOTIFICATIONS.map((n) => (
            <div
              key={n.id}
              style={{
                position: "relative",
                padding: "8px",
                borderTop: `1px solid ${C.glassBorder}`,
              }}
            >
              <div style={{ fontSize: 13, color: C.text }}>
                {n.text}
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: C.muted,
                  marginTop: 2,
                }}
              >
                {n.time}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    <IconButton C={C} onClick={onToggleTheme}>
      {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
    </IconButton>

    <div style={{ position: "relative" }} ref={profileRef}>
      <IconButton
        C={C}
        onClick={() => setProfileOpen((v) => !v)}
      >
        <User size={17} />
      </IconButton>

      {profileOpen && (
        <div style={dropdownStyle}>
          <Sheen C={C} />

          <div
            style={rowStyle}
            onClick={() => {
              setProfileOpen(false);
              navigate("/dashboard");
            }}
          >
            <LayoutDashboard size={15} />
            Dashboard
          </div>

          <div
            style={rowStyle}
            onClick={() => {
              setProfileOpen(false);
              navigate("/login");
            }}
          >
            <LogOut size={15} />
            Log out
          </div>
        </div>
      )}
    </div>

    <div ref={menuRef} style={{ position: "relative" }}>
      <IconButton
        C={C}
        onClick={() => setMenuOpen((v) => !v)}
      >
        {menuOpen ? <X size={17} /> : <Menu size={17} />}
      </IconButton>

      {menuOpen && (
        <div style={dropdownStyle}>
          <Sheen C={C} />

          {[
            { label: "Home", to: "/" },
            { label: "Wishlist", to: "/wishlist" },
            { label: "My OTT", to: "/my-ott" },
            { label: "Settings", to: "/settings" },
            { label: "About", to: "/about" },
            { label: "Help", to: "/help" },
            { label: "Feedback", to: "/feedback" },
          ].map((item) => (
            <div
              key={item.label}
              style={rowStyle}
              onClick={() => {
                setMenuOpen(false);
                navigate(item.to);
              }}
            >
              {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
</div>
    </div>
  );
}
