import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compiler optimizations
  compiler: {
    // Remove console.log in production (optional, but helps with bundle size)
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // Keep errors and warnings
    } : false,
  },
  
  // Optimize production builds
  productionBrowserSourceMaps: false, // Disable source maps in production for smaller bundles
  
  // Turbopack configuration (Next.js 16+ default)
  // Empty config silences the warning - Turbopack handles module resolution automatically
  turbopack: {},
  
  // Webpack configuration (for --webpack flag or production builds that use webpack)
  webpack: (config, { isServer }) => {
    // Only configure for client-side builds
    if (!isServer) {
      // Ensure Node.js modules are not bundled (they're not available in browser)
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    
    return config;
  },
  
  // Headers configuration for SharedArrayBuffer support (required for future ffmpeg.wasm)
  // Note: COEP is commented out for now as it blocks heic2any from loading its WASM dependencies
  // We'll enable it when we add ffmpeg.wasm and ensure all resources have proper CORS headers
  headers: async () => {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          // Temporarily disabled to allow heic2any to work
          // {
          //   key: "Cross-Origin-Embedder-Policy",
          //   value: "require-corp",
          // },
        ],
      },
    ];
  },
};

export default nextConfig;

