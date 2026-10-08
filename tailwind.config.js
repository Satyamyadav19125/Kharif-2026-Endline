/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Agriculture greens — the primary brand colour.
        field: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        // Soil / earth tones for accents.
        earth: {
          50: "#fefce8",
          100: "#fef9c3",
          200: "#fef08a",
          400: "#facc15",
          600: "#ca8a04",
          700: "#a16207",
          800: "#854d0e",
        },
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "field-gradient": "linear-gradient(135deg, #f0fdf4 0%, #fefce8 100%)",
        "hero-gradient": "linear-gradient(135deg, #14532d 0%, #15803d 50%, #65a30d 100%)",
      },
    },
  },
  plugins: [],
};
