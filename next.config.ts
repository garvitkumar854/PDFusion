
import type {NextConfig} from 'next';
import withPWAInit from '@ducanh2912/next-pwa';
import path from 'path';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: false,
  disable: process.env.NODE_ENV === 'development',
  scope: '/',
  swSrc: 'service-worker.js', // Ensure you have a custom service worker file if needed
  exclude: [
    ({ asset, compilation }) => {
      // Exclude files that are not needed for offline caching
      if (
        asset.name.startsWith("server/") ||
        asset.name.match(/^((app-pages-manifest|build-manifest|react-loadable-manifest|middleware-manifest|next-font-manifest)\.js(on)?|sitemap\.xml)$/) ||
        asset.name.endsWith("firebase-messaging-sw.js")
      ) {
        return true;
      }
      return false;
    },
  ],
  runtimeCaching: [
    {
      urlPattern: ({ url, sameOrigin }) => {
        return sameOrigin && url.pathname.startsWith('/_next/static/');
      },
      handler: 'NetworkFirst',
      options: {
        cacheName: 'static-assets',
        expiration: {
          maxEntries: 128,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      urlPattern: ({ url, sameOrigin }) => {
        // These pages require network access and should fallback to offline page
        const onlineOnlyPages = [
          '/currency-converter',
          '/text-summarizer',
          '/html-to-pdf'
        ];
        return sameOrigin && onlineOnlyPages.some(p => url.pathname.startsWith(p));
      },
      handler: 'NetworkOnly',
      options: {
        cacheName: 'online-only-pages',
      }
    },
    {
        urlPattern: ({url, sameOrigin}) => {
            // Cache all other pages with a NetworkFirst strategy.
            // This includes the homepage and all offline-capable tools.
            return sameOrigin && (
                url.pathname === '/' ||
                url.pathname.startsWith('/about') ||
                url.pathname.startsWith('/contact') ||
                url.pathname.startsWith('/merger') ||
                url.pathname.startsWith('/split-pdf') ||
                url.pathname.startsWith('/organize-pdf') ||
                url.pathname.startsWith('/pdf-to-jpg') ||
                url.pathname.startsWith('/jpg-to-pdf') ||
                url.pathname.startsWith('/add-watermark') ||
                url.pathname.startsWith('/rotate-pdf') ||
                url.pathname.startsWith('/add-page-numbers') ||
                url.pathname.startsWith('/privacy-policy') ||
                url.pathname.startsWith('/more-tools') ||
                url.pathname.startsWith('/calculator') ||
                url.pathname.startsWith('/qr-code-generator') ||
                url.pathname.startsWith('/password-generator') ||
                url.pathname.startsWith('/unit-converter') ||
                url.pathname.startsWith('/markdown-to-html') ||
                url.pathname.startsWith('/pdf-to-html')
            )
        },
        handler: 'NetworkFirst',
        options: {
            cacheName: 'pages',
            expiration: {
                maxEntries: 64,
                maxAgeSeconds: 24 * 60 * 60, // 24 hours
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
