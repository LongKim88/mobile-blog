import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f7f7f8",
          100: "#eeeef1",
          200: "#d8d8de",
          300: "#b4b4be",
          400: "#86868f",
          500: "#5b5b63",
          600: "#3f3f45",
          700: "#27272b",
          800: "#17171a",
          900: "#0a0a0c",
        },
        accent: {
          DEFAULT: "#ff5a1f",
          50: "#fff4ee",
          500: "#ff5a1f",
          600: "#e84409",
        },
        cat: {
          it: "#2563eb",
          book: "#9333ea",
        },
        // Win98 디자인 토큰 (공개 사이트 전반)
        win: {
          silver: "#c0c0c0",
          "silver-light": "#dfdfdf",
          "silver-dark": "#808080",
          navy: "#000080",
          "navy-light": "#0000c0",
          purple: "#800080",
          teal: "#008080",
          black: "#000000",
        },
      },
      fontFamily: {
        // 어드민 등 기능 화면에서 명시적으로 사용
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Pretendard",
          "Apple SD Gothic Neo",
          "sans-serif",
        ],
        serif: ["ui-serif", "Georgia", "Cambria", "serif"],
        // 공개 사이트 기본. 한글은 D2Coding/Apple SD Gothic Neo로 폴백
        mono: [
          "Courier New",
          "Lucida Console",
          "D2Coding",
          "Apple SD Gothic Neo",
          "monospace",
        ],
      },
      maxWidth: {
        article: "44rem",
      },
    },
  },
  plugins: [],
};

export default config;
