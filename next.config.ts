
import type {NextConfig} from 'next';
import withPWAInit from '@ducanh2912/next-pwa';
import path from 'path';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: false,
  disable: process.env.NODE_ENV === 'development',
  scope: '/',
  runtimeCaching: [
    {
      urlPattern: ({ url, sameOrigin }) => {
        return sameOrigin && url.pathname.startsWith('/_next/static/');
      },
      handler: 'NetworkFirst',
      options: {
        cacheName: 'static-assets',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
        urlPattern: ({url, sameOrigin}) => {
            return sameOrigin && (
                url.pathname === '/' ||
                url.pathname.startsWith('/add-page-numbers') ||
                url.pathname.startsWith('/jpg-to-pdf') ||
                url.pathname.startsWith('/merger') ||
                url.pathname.startsWith('/organize-pdf') ||
                url.pathname.startsWith('/pdf-to-html') ||
                url.pathname.startsWith('/pdf-to-jpg') ||
                url.pathname.startsWith('/rotate-pdf') ||
                url.pathname.startsWith('/split-pdf')
            )
        },
        handler: 'NetworkFirst',
        options: {
            cacheName: 'offline-pages',
            expiration: {
                maxEntries: 32,
                maxAgeSeconds: 24 * 60 * 60,
            }
        }
    }
  ],
  fallbacks: {
    document: '/_offline',
  }
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

    config.resolve.alias['pdfjs-dist'] = path.join(__dirname, 'node_modules/pdfjs-dist');


    return config;
  },
};

export default withPWA(nextConfig);
