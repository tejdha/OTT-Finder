import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Search, Heart, Tv, User } from "lucide-react";

export default function Tabs({ C }) {
  const location = useLocation();

  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth < 768
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const tabs = [
    {
      label: "Home",
      path: "/",
      icon: Home,
    },
    {
      label: "Search",
      path: "/search",
      icon: Search,
    },
    {
      label: "Wishlist",
      path: "/wishlist",
      icon: Heart,
    },
    {
      label: "My OTT",
      path: "/my-ott",
      icon: Tv,
    },
    {
  label: "Profile",
  path: "/dashboard",
  icon: User,
},
  ];

  const desktopTabs = [
  { label: "Home", path: "/", icon: Home },
  { label: "Wishlist", path: "/wishlist", icon: Heart },
  { label: "My OTT", path: "/my-ott", icon: Tv },
];

  /* =========================
     MOBILE
     ========================= */

  if (isMobile) {
    return (
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,

          width: "100%",

          zIndex: 1000,

          boxSizing: "border-box",

          padding: "8px 10px",

          background:
            "rgba(10, 10, 14, 0.92)",

          borderTop: `1px solid ${C.glassBorder}`,

          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <div
          style={{
            width: "100%",

            display: "grid",
            gridTemplateColumns:
              "repeat(5, 1fr)",

            gap: 6,
          }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;

            const active =
              location.pathname === tab.path;

            return (
              <Link
                key={tab.path}
                to={tab.path}
                style={{
                  textDecoration: "none",

                  display: "flex",
                  flexDirection: "column",

                  alignItems: "center",
                  justifyContent: "center",

                  gap: 3,

                  minHeight: 48,

                  borderRadius: 12,

                  color: active
                    ? C.coralSolid
                    : C.muted,

                  background: active
                    ? C.glass
                    : "transparent",
                }}
              >
                <Icon size={19} />

                <span
                  style={{
                    fontSize: 11,
                    fontWeight: active
                      ? 700
                      : 600,
                  }}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  /* =========================
     TABLET + DESKTOP
     ========================= */

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,

          padding: 6,

          borderRadius: 18,

          background: C.glass,
          border: `1px solid ${C.glassBorder}`,

          backdropFilter: "blur(16px)",
          WebkitBackdropFilter:
            "blur(16px)",
        }}
      >
        {desktopTabs.map((tab) => {
          const Icon = tab.icon;

          const active =
            location.pathname === tab.path;

          return (
            <Link
              key={tab.path}
              to={tab.path}
              style={{
                textDecoration: "none",

                display: "flex",
                alignItems: "center",

                gap: 7,

                padding: "9px 16px",

                borderRadius: 12,

                color: active
                  ? C.coralSolid
                  : C.muted,

                background: active
                  ? C.glass
                  : "transparent",

                fontSize: 13,
                fontWeight: active
                  ? 700
                  : 600,
              }}
            >
              <Icon size={15} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}