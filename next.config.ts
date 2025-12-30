
import type {NextConfig} from 'next';
import path from 'path';

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

export default nextConfig;
