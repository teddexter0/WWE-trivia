import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        rookie: "var(--rookie)",
        contender: "var(--contender)",
        veteran: "var(--veteran)",
        legend: "var(--legend)",
        hof: "var(--hof)",
      },
    },
  },
  plugins: [],
};

export default config;
