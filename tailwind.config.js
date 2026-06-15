/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        cyber: {
          bg: "#05070d",
          panel: "#0d121e",
          panel2: "#141b2d",
          border: "#1e2a45",
          border2: "#22304f",
          gold: "#ffc107",
          red: "#ff3d57",
          green: "#00e5a0",
          blue: "#2196ff",
          violet: "#a855f7",
        },
      },
      fontFamily: {
        display: ["Orbitron", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "scanlines":
          "repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 3px)",
        "grid-tech":
          "linear-gradient(rgba(34,48,79,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(34,48,79,0.25) 1px, transparent 1px)",
      },
      boxShadow: {
        "neon-gold": "0 0 16px rgba(255,193,7,0.5)",
        "neon-red": "0 0 16px rgba(255,61,87,0.6)",
        "neon-blue": "0 0 16px rgba(33,150,255,0.5)",
        "inner-tech": "inset 0 2px 10px rgba(0,0,0,0.7), inset 0 -1px 0 rgba(255,255,255,0.04)",
      },
      keyframes: {
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        "pulse-fast": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "scan-line": "scan-line 6s linear infinite",
        "pulse-fast": "pulse-fast 0.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
