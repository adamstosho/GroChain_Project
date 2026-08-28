import path from 'path';
import { fileURLToPath } from 'url';
import withPWA from 'next-pwa';
import webpack from 'webpack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Silence the warning about multiple lockfiles in monorepo
  outputFileTracingRoot: path.join(__dirname, '../'),
  async rewrites() {
    const apiOrigin = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'
    return [
      {
        source: '/api/:path*',
        destination: `${apiOrigin}/api/:path*`,
      },
    ]
  },
  // Add webpack optimization for chunk loading
  webpack: (config, { isServer, dev }) => {
    // Add path resolution for @ alias
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    };
    
    // Fix for "exports is not defined" error - simple approach
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
      '.jsx': ['.jsx', '.tsx'],
    };
    
    // Add module resolution fixes
    config.resolve.mainFields = ['browser', 'module', 'main'];
    
    // Add module rules to handle exports and CommonJS modules
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false,
      },
    });
    
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
}

// PWA Configuration - Only enable in production and non-Vercel environments
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV
const isDevelopment = process.env.NODE_ENV === 'development'

const pwaConfig = withPWA({
  dest: 'public',
  register: !isVercel && !isDevelopment,
  skipWaiting: !isVercel && !isDevelopment,
  disable: isDevelopment || isVercel || process.env.DISABLE_PWA === '1',
  buildExcludes: [/middleware-manifest\.json$/, /routes-manifest\.json$/, /app-build-manifest\.json$/],
  fallbacks: {
    document: '/offline',
  },
  publicExcludes: ['!robots.txt', '!sitemap.xml'],
  // Add additional excludes to prevent precaching issues
  additionalManifestEntries: [],
  runtimeCaching: [
    {
      urlPattern: /^https?:\/\/.*\/api\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 16,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-stylesheets',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
      },
    },
    {
      urlPattern: /^https?:\/\/.*\.(?:js|css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
    {
      urlPattern: /^https?:\/\/.*\/_next\/static\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
      },
    },
  ],
});

export default pwaConfig(nextConfig);