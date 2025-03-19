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
  transpilePackages: ['lucide-react', 'matrix-js-sdk'],
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
            value: "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; frame-ancestors 'self' *"
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
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        path: false,
        os: false,
        buffer: false,
      };
    }

    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname)
    };

    if (!isServer) {
      config.plugins.push(
        new config.plugins.find(plugin => plugin.constructor.name === 'DefinePlugin')
          .constructor({
            ...Object.fromEntries(
              Object.entries(process.env).map(([key, value]) => [`process.env.${key}`, JSON.stringify(value)])
            ),
            'process.env': '{}',
            'global': 'window',
          })
      );
    }

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
        source: '/api/proxy/:path*',
        destination: '/api/proxy/:path*'
      }
    ];
  }
};

export default nextConfig;
