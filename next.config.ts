
import type {NextConfig} from 'next';
import withPWAInit from '@ducanh2912/next-pwa';
import path from 'path';

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
  webpack: (config, { isServer }) => {
    config.resolve.alias['pdfjs-dist'] = path.join(__dirname, 'node_modules/pdfjs-dist');
    config.module.rules.push({
      test: /pdf\.mjs$/,
      type: "javascript/auto",
    });
    return config;
  },
};

export default withPWA(nextConfig);
