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
        cream: {
          50: "#FAF6F0",
          100: "#F4EFE6",
          200: "#E8E2D8",
        },
        ink: {
          DEFAULT: "#1A1A1A",
          soft: "#3D3D3D",
          muted: "#6B6B6B",
        },
        terracotta: {
          DEFAULT: "#E07856",
          soft: "#F4D4C8",
          dark: "#C85F3E",
        },
        sage: {
          DEFAULT: "#7A9E7E",
          soft: "#D6E3D7",
        },
      },
      fontFamily: {
        serif: ['"Fraunces"', "Georgia", "serif"],
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 12px rgba(26, 26, 26, 0.06)",
        cardHover: "0 4px 20px rgba(26, 26, 26, 0.10)",
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
      },
      keyframes: {
        "fade-slide-in": {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-out": {
          "0%": { opacity: "1", transform: "translateX(0)" },
          "100%": { opacity: "0", transform: "translateX(40px)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-slide-in": "fade-slide-in 0.4s ease-out forwards",
        "slide-out": "slide-out 0.3s ease-in forwards",
        "scale-in": "scale-in 0.5s ease-out forwards",
      },
    },
  },
  plugins: [],
};
