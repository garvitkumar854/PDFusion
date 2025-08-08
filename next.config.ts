
import type {NextConfig} from 'next';
import withPWAInit from 'next-pwa';
import path from 'path';

const withPWA = withPWAInit({
  dest: 'public',
  sw: 'sw.js',
  register: true,
  skipWaiting: false, // Set to false to allow user to trigger update
  disable: process.env.NODE_ENV === 'development',
  fallbacks: {
    document: '/_offline',
  },
   runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
    {
      urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-font-assets',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-image-assets',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    {
      urlPattern: /\.(?:js|css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-js-css-assets',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    {
        urlPattern: /.*/i,
        handler: 'NetworkFirst',
        options: {
            cacheName: 'others',
            expiration: {
                maxEntries: 32,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
            },
            networkTimeoutSeconds: 10,
        },
    },
  ],
});

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Fix for pdfjs-dist and other packages with require.extensions
    config.module.rules.push({
      test: /pdf\.mjs$/,
      type: "javascript/auto",
    });
    
    config.module.rules.push({
      test: /node_modules\/handlebars\/lib\/index\.js$/,
      loader: 'string-replace-loader',
      options: {
        search: `require.extensions\\['.js'\\]`,
        replace: '() => {}',
        flags: 'g',
      },
    });

    return config;
  },
};

export default withPWA(nextConfig);
