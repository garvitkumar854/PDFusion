
import type {NextConfig} from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  disable: process.env.NODE_ENV === 'development',
  scope: '/',
  sw: 'service-worker.js',
  fallbacks: {
    document: '/offline',
  },
  // Note: no custom `swSrc` here. In @ducanh2912/next-pwa v10 `swSrc` is only
  // honoured inside `workboxOptions`, and taking that path skips the plugin's
  // fallback-worker build, so the `/offline` document fallback above would
  // stop working. The generated worker already covers precaching, fonts,
  // static assets, RSC payloads and network-first navigation.
});

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // `typescript.ignoreBuildErrors` used to be true, which hid 20 real type
  // errors (including two that pointed at a broken drag-and-drop handler).
  // `npm run typecheck` is clean, so let the build enforce it.
  eslint: {
    ignoreDuringBuilds: true,
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
