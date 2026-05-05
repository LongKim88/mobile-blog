const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // next/image 컴포넌트를 쓰지 않으므로 옵티마이저 비활성화 — /api/_next/image 외부 fetch 경로 차단
    unoptimized: true,
  },
};

module.exports = withNextIntl(nextConfig);
