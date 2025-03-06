import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: ['lucide-react'],
  images: {
    unoptimized: true,
  },
  experimental: {
    webpackBuildWorker: true,
    esmExternals: 'loose'
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' *"
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          }
        ]
      }
    ];
  },
  webpack: (config, { dev, isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname)
    };

    config.module.rules.push({
      test: /\.html$/,
      use: 'ignore-loader'
    });

    if (!dev && !isServer) {
      Object.assign(config.resolve.alias, {
        'react/jsx-runtime.js': 'preact/compat/jsx-runtime',
        react: 'preact/compat',
        'react-dom/test-utils': 'preact/test-utils',
        'react-dom': 'preact/compat',
      });
    }

    config.externals.push({
      "utf-8-validate": "commonjs utf-8-validate",
      bufferutil: "commonjs bufferutil",
    });

    return config;
  },
  async rewrites() {
    return [
      {
        source: '/bare/:path*',
        destination: 'https://uv.holyubofficial.net/:path*'
      },
      {
        source: '/proxy/:path*',
        destination: '/api/proxy/:path*'
      }
    ];
  }
};

export default nextConfig;
