export const THEMES = {
  light: {
    bgGradient: "linear-gradient(160deg, #DCE0D8 0%, #D3DBD1 100%)",
    glass: "rgba(255,255,255,0.65)",
    glassBorder: "rgba(20,40,25,0.09)",
    glassShadow: "0 10px 26px rgba(30,50,35,0.10)",
    sheen: "linear-gradient(120deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 45%)",
    text: "#1F2A1F",
    muted: "#6B7A6E",
    coral: "linear-gradient(135deg, #9BCBA3, #6FA97D)",
    coralSolid: "#6FA97D",
    accentText: "#FFFFFF",
    accentShadow: "rgba(111,169,125,0.30)",
    green: "linear-gradient(135deg, #3BA7C7, #2C7E9C)",
    greenSolid: "#2C7E9C",
    iconBg: "rgba(20,40,25,0.05)",
    iconBorder: "rgba(20,40,25,0.10)",
    selectBg: "#FFFFFF",
    selectText: "#1F2A1F",
  },
  dark: {
    bgGradient: "linear-gradient(160deg, #06060A 0%, #0B0B0F 100%)",
    glass: "rgba(255,255,255,0.05)",
    glassBorder: "rgba(255,255,255,0.13)",
    glassShadow: "0 14px 34px rgba(0,0,0,0.65)",
    sheen: "linear-gradient(120deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 45%)",
    text: "#F2F2F5",
    muted: "#A8A8B2",
    coral: "linear-gradient(135deg, #FFFFFF, #B8B8BD)",
    coralSolid: "#E8E8ED",
    accentText: "#0B0B0F",
    accentShadow: "rgba(255,255,255,0.18)",
    green: "linear-gradient(135deg, #C9C9CE, #9A9AA0)",
    greenSolid: "#D5D5DA",
    iconBg: "rgba(255,255,255,0.06)",
    iconBorder: "rgba(255,255,255,0.14)",
    selectBg: "#1A1A20",
    selectText: "#F2F2F5",
  },
};

export const DISPLAY_FONT = "'Manrope', sans-serif";
export const BODY_FONT = "'Inter', sans-serif";
export const FONT_IMPORT_URL =
  "https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=Inter:wght@400;500;600&display=swap";

export const CONTENT_MAX_WIDTH = 1600;

export const GLOBAL_CSS = `
  .hide-scrollbar {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }

  html {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  html::-webkit-scrollbar {
    width: 0;
    height: 0;
    display: none;
  }
    body{
    margin: 0;
    background: #0b0b0F;
  }
`;



export function glassStyle(C, extra = {}) {
  return {
    background: C.glass,
    border: `1px solid ${C.glassBorder}`,
    boxShadow: C.glassShadow,
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(16px)",
    position: "relative",
    overflow: "hidden",
    ...extra,
  };
}
