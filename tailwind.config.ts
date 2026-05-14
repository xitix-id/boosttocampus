import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        btc: {
          ink: "#16002f",
          violet: "#421285",
          violetSoft: "#5f25b2",
          lime: "#8fe70b",
          limeSoft: "#c3ff59",
          mist: "#bca6db",
          panel: "rgba(255, 255, 255, 0.075)",
          line: "rgba(255, 255, 255, 0.14)"
        }
      },
      boxShadow: {
        neon: "0 0 0 1px rgba(143, 231, 11, 0.22), 0 18px 50px rgba(18, 0, 42, 0.32)"
      },
      fontFamily: {
        display: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
