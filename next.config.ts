
import type {NextConfig} from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: false,
  disable: process.env.NODE_ENV === 'development',
  scope: '/',
  swSrc: 'src/app/sw.ts',
  sw: 'service-worker.js',
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
  webpack: (config) => {
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /pdfjs-dist[\\/]legacy[\\/]build[\\/]pdf\.mjs$/,
        message: /topLevelAwait|target environment does not appear to support 'async\/await'/,
      },
    ];
    return config;
  },
};

export default withPWA(nextConfig);
