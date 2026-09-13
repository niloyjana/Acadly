import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Acadly token system — see SETUP.md "Design tokens"
        ink: "#161422",          // near-black text, slightly violet-tinted
        paper: "#F3F1FA",        // soft lavender-white light bg
        midnight: "#0E0B1A",     // deep indigo-black dark bg
        acadly: {
          violet: "#5B4CFF",     // primary accent
          plum: "#8A4FFF",       // secondary accent
          amber: "#F2A93B",      // accountability / points accent
          coral: "#FF6B6B",      // overdue / danger
          mint: "#3FD6A0",       // success / approved
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      backdropBlur: { glass: "20px" },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(31, 20, 90, 0.15)",
        "glass-dark": "0 8px 32px 0 rgba(0, 0, 0, 0.45)",
      },
      borderRadius: { xl2: "1.25rem" },
    },
  },
  plugins: [],
};
export default config;
