import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  Bell,
  Sun,
  Moon,
  User,
  Menu,
  X,
  LayoutDashboard,
  LogOut,
} from "lucide-react";

import {
  glassStyle,
  DISPLAY_FONT,
  BODY_FONT,
} from "../styles/theme";

import { NOTIFICATIONS } from "../data/movies";
import {
  Sheen,
  IconButton,
  useOutsideClose,
} from "./Primitives";

import useScrollDirection from "../hooks/useScrollDirection";
import { SearchBar } from "./SearchAndFilters";
import RegionSelect from "./RegionSelect";

export default function Header({
  C,
  theme,
  onToggleTheme,
  query,
  onQueryChange,
  showSearch = true,
  userCountry,
  onManualCountry,
  mobileLayout = false,
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [isTablet, setIsTablet] = useState(
    () => window.innerWidth >= 768 && window.innerWidth < 1100
  );

  useEffect(() => {
    const handleResize = () => {
      setIsTablet(
        window.innerWidth >= 768 && window.innerWidth < 1100
      );
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const { direction, isAtTop } = useScrollDirection();

  // Desktop/tablet dynamic search behavior
  const showHeaderSearch = !isAtTop && direction === "up";

  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const menuRef = useRef(null);

  const navigate = useNavigate();

  useOutsideClose(notifRef, () => setNotifOpen(false));
  useOutsideClose(profileRef, () => setProfileOpen(false));
  useOutsideClose(menuRef, () => setMenuOpen(false));

  const dropdownStyle = {
    ...glassStyle(C),
    position: "absolute",
    right: 0,
    top: 50,
    width: 250,
    maxWidth: "calc(100vw - 30px)",
    borderRadius: 18,
    padding: 10,
    fontFamily: BODY_FONT,
    zIndex: 500,
  };

  const rowStyle = {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 10px",
    borderRadius: 12,
    color: C.text,
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
  };

  return (
    <div
      style={{
        position: "relative",
        zIndex: 1000,
      }}
    >
      {/* =========================================================
          TOP HEADER ROW
          ========================================================= */}
      <div
        style={{
          display: "grid",

          // MOBILE:
          // Brand on left + country/menu controls on right
          //
          // TABLET:
          // Existing tablet structure
          //
          // DESKTOP:
          // Existing desktop structure
          gridTemplateColumns: mobileLayout
            ? "minmax(0, 1fr) auto"
            : isTablet
            ? "auto minmax(170px, 1fr) auto"
            : "minmax(0, 1fr) auto minmax(0, 1fr)",

          alignItems: "center",

          width: "95%",
          margin: "0 auto",

          // Mobile doesn't need the large bottom spacing
          padding: mobileLayout
            ? "0 0 12px 0"
            : "0 0 22px 0",
        }}
      >
        {/* =========================================================
            LEFT — BRAND
            ========================================================= */}
        <Link
          to="/"
          style={{
            textDecoration: "none",
            justifySelf: "start",
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontFamily: DISPLAY_FONT,
              fontWeight: 800,
              fontSize: mobileLayout ? 20 : 22,
              color: C.coralSolid,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Where To Watch
          </div>
        </Link>

        {/* =========================================================
            CENTER — DESKTOP/TABLET DYNAMIC SEARCH

            Completely hidden on mobile.
            Mobile gets its own full search bar below.
            ========================================================= */}
        <div
          style={{
            minWidth: "100%",
            display: mobileLayout ? "none" : "flex",
            justifyContent: "center",
          }}
        >
          {showSearch && showHeaderSearch && (
            <div
              style={{
                width: isTablet
                  ? "clamp(250px, 20vw, 280px)"
                  : "clamp(170px, 25vw, 400px)",

                justifySelf: isTablet
                  ? "start"
                  : "center",
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

        {/* =========================================================
            RIGHT — COUNTRY + CONTROLS
            ========================================================= */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: mobileLayout ? 6 : 8,
            justifySelf: "end",
          }}
        >
          {/* COUNTRY SELECTOR
              Visible on mobile + tablet + desktop */}
          <RegionSelect
            selectedCountryName={userCountry}
            onManualSelect={onManualCountry}
            C={C}
            mobileFixed={mobileLayout}
          />

          {/* =======================================================
              DESKTOP/TABLET ONLY:
              Notifications
              Theme
              Profile
              ======================================================= */}
          {!mobileLayout && (
            <>
              {/* ---------------- Notifications ---------------- */}
              <div
                style={{
                  position: "relative",
                }}
                ref={notifRef}
              >
                <IconButton
                  C={C}
                  badge
                  onClick={() =>
                    setNotifOpen((v) => !v)
                  }
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
                        <div
                          style={{
                            fontSize: 13,
                            color: C.text,
                          }}
                        >
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

              {/* ---------------- Theme ---------------- */}
              <IconButton
                C={C}
                onClick={onToggleTheme}
              >
                {theme === "dark" ? (
                  <Sun size={17} />
                ) : (
                  <Moon size={17} />
                )}
              </IconButton>

              {/* ---------------- Profile ---------------- */}
              <div
                style={{
                  position: "relative",
                }}
                ref={profileRef}
              >
                <IconButton
                  C={C}
                  onClick={() =>
                    setProfileOpen((v) => !v)
                  }
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
            </>
          )}

          {/* =======================================================
              HAMBURGER
              ======================================================= */}
          <div
            ref={menuRef}
            style={{
              position: "relative",
            }}
          >
            <IconButton
              C={C}
              onClick={() =>
                setMenuOpen((v) => !v)
              }
            >
              {menuOpen ? (
                <X size={17} />
              ) : (
                <Menu size={17} />
              )}
            </IconButton>

      {menuOpen && (
        <div style={{
          ...dropdownStyle,
          ...(mobileLayout
            ? {
                position: "fixed",
                top: 70,
                right: 8,
                width: 150,
                zIndex: 99999,
              }
                : {}),
                }}>
                <Sheen C={C} />

                {/* =================================================
                    MOBILE MENU ITEMS

                    Home / Wishlist / My OTT are intentionally NOT
                    here because they will be fixed bottom tabs.
                    ================================================= */}
                {mobileLayout && (
                  <>
                    {/* Notifications */}
                    <div
                      style={rowStyle}
                      onClick={() => {
                        setMenuOpen(false);
                        setNotifOpen(true);
                      }}
                    >
                      <Bell size={15} />
                      Notifications
                    </div>

                    {/* Theme */}
                    <div
                      style={rowStyle}
                      onClick={() => {
                        setMenuOpen(false);
                        onToggleTheme();
                      }}
                    >
                      {theme === "dark" ? (
                        <Sun size={15} />
                      ) : (
                        <Moon size={15} />
                      )}

                      {theme === "dark"
                        ? "Light theme"
                        : "Dark theme"}
                    </div>

                    {/* Profile */}
                    {/* <div
                      style={rowStyle}
                      onClick={() => {
                        setMenuOpen(false);
                        navigate("/dashboard");
                      }}
                    >
                      <User size={15} />
                      Profile
                    </div> */}

                    <div
                      style={rowStyle}
                      onClick={() => {
                        setMenuOpen(false);
                        navigate("/login");
                      }}
                    >
                      <LogOut size={15} />
                      Log out
                    </div>

                    {/* Dashboard */}
                    {/* <div
                      style={rowStyle}
                      onClick={() => {
                        setMenuOpen(false);
                        navigate("/dashboard");
                      }}
                    >
                      <LayoutDashboard size={15} />
                      Dashboard
                    </div> */}

                    {/* Divider */}
                    <div
                      style={{
                        height: 1,
                        background: C.glassBorder,
                        margin: "6px 4px",
                      }}
                    />
                  </>
                )}

                {/* =================================================
                    COMMON MENU ITEMS

                    On mobile:
                    Settings
                    About
                    Help
                    Feedback

                    On desktop/tablet:
                    Same items.
                    ================================================= */}
                {[
                  {
                    label: "Settings",
                    to: "/settings",
                  },
                  {
                    label: "About",
                    to: "/about",
                  },
                  {
                    label: "Help",
                    to: "/help",
                  },
                  {
                    label: "Feedback",
                    to: "/feedback",
                  },
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
            {/* =========================================================
    MOBILE NOTIFICATION PANEL
    ========================================================= */}
{mobileLayout && notifOpen && (
  <div
    ref={notifRef}
    style={{
      ...dropdownStyle,
      position: "fixed",
      top: 70,
      right: 8,
      width: 180,
      maxWidth: "calc(100vw - 16px)",
      maxHeight: "70vh",
      overflowY: "auto",
      zIndex: 100000,
    }}
  >
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
        <div
          style={{
            fontSize: 13,
            color: C.text,
          }}
        >
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
        </div>
      </div>

      {/* ===========================================================
          MOBILE SEARCH BAR

          This is a completely separate normal search bar.

          It appears:
          Header
          ↓
          Search bar
          ↓
          Filters
          ↓
          Content

          It is NOT the dynamic desktop/tablet search bar.
          =========================================================== */}
    </div>
  );
}