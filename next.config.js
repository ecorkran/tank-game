/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Turn off strict mode to avoid issues with game state updates
  // Simple configuration that works for both Vercel and local development
  images: {
    unoptimized: true
  },
  typescript: {
    // During development, you can ignore TypeScript errors
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  }
};

module.exports = nextConfig;