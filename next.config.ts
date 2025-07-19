
import type {NextConfig} from 'next';
import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  fallbacks: {
    document: '/_offline',
  },
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
    // Exclude canvas from being processed by Next.js on the server
    if (isServer) {
      config.externals.push('canvas');
    }
    
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
