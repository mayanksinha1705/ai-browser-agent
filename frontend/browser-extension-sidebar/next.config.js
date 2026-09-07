/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['lucide-react'],
  // Hide the Next.js dev-tools badge ("N" / issue count) — it renders inside
  // the extension's floating chat window and pollutes the UI.
  devIndicators: false
};

module.exports = nextConfig;
