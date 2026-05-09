import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101214",
        forge: "#17d97f",
        brass: "#f2c94c",
        oxide: "#ff5c35",
      },
      boxShadow: {
        focus: "0 0 0 3px rgba(23, 217, 127, 0.24)",
      },
    },
  },
  plugins: [],
};

export default config;
