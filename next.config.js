/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Turn off strict mode to avoid issues with game state updates
  // Configure based on environment
  ...(process.env.VERCEL
    ? {
        // Vercel-specific settings
        output: 'standalone',
        images: { unoptimized: true }
      }
    : {
        // Local development settings
        output: 'export',
        images: { unoptimized: true }
      }
  ),
  typescript: {
    // During development, you can ignore TypeScript errors
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  }
};

module.exports = nextConfig;