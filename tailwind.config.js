/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
        },
        glass: {
          DEFAULT: "rgba(255,255,255,0.62)",
          strong: "rgba(255,255,255,0.78)",
          border: "rgba(255,237,213,0.72)",
          orange: "rgba(249,115,22,0.28)",
          soft: "rgba(249,115,22,0.16)",
        },
      },
      boxShadow: {
        glass: "0 24px 70px rgba(249,115,22,0.16), 0 10px 32px rgba(23,32,51,0.08)",
        glow: "0 0 0 1px rgba(255,237,213,0.62), 0 0 24px rgba(249,115,22,0.34), 0 10px 28px rgba(234,88,12,0.18)",
        "orange-glow": "0 0 0 1px rgba(255,237,213,0.8), 0 0 32px rgba(249,115,22,0.48), 0 14px 34px rgba(234,88,12,0.24)",
      },
      backgroundImage: {
        "orange-glass": "linear-gradient(135deg, rgba(255,255,255,0.42), rgba(249,115,22,0.24))",
        "app-glow": "radial-gradient(circle at top left, rgba(249,115,22,0.34), transparent 30%), radial-gradient(circle at bottom right, rgba(251,146,60,0.22), transparent 34%), linear-gradient(135deg, #fff7ed 0%, #f8fafc 46%, #ffedd5 100%)",
      },
      backdropBlur: {
        glass: "18px",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
