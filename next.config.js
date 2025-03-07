/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Turn off strict mode to avoid issues with game state updates
  // Remove 'output: export' for Vercel deployment
  // output: 'export',
  images: {
    unoptimized: true
  },
  typescript: {
    // During development, you can ignore TypeScript errors
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  // Add this for proper Vercel deployment
  distDir: 'build',
};

module.exports = nextConfig;