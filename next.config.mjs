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
    esmExternals: 'loose',
    webpackBuildWorker: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  webpack: (config, { dev, isServer }) => {
    // Add alias for '@' to point to root directory
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname)
    };

    // HTMLローダーの設定を追加
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
    })

    // Babelの設定を追加
    config.module.rules.push({
      test: /\.(js|jsx|ts|tsx)$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          cacheDirectory: true,
        },
      },
    });

    return config;
  },
  async rewrites() {
    return [
      {
        source: '/bare/:path*',
        destination: 'https://uv.holyubofficial.net/:path*'
      }
    ]
  }
}

export default nextConfig
