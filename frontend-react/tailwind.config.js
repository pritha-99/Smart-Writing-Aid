/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          950: "#060b17",
          900: "#0a1220",
          850: "#111c2e",
          800: "#152235"
        },
        accent: {
          400: "#53a2ff",
          500: "#318bff",
          600: "#1f75ff"
        }
      },
      boxShadow: {
        soft: "0 8px 30px rgba(0, 0, 0, 0.28)",
        glow: "0 0 0 1px rgba(83, 162, 255, 0.3), 0 10px 30px rgba(31, 117, 255, 0.25)"
      },
      keyframes: {
        floatUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        pulseDot: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.18)", opacity: "0.7" }
        }
      },
      animation: {
        floatUp: "floatUp 360ms ease forwards",
        pulseDot: "pulseDot 1.4s ease-in-out infinite"
      }
    }
  },
  plugins: []
};
