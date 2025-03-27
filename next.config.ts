import type { NextConfig } from 'next';
import type { Configuration as WebpackConfig } from 'webpack';

/** @type {import('next').NextConfig} */
// Interface for the webpack configuration function
interface WebpackConfigFunction {
  (config: WebpackConfig): WebpackConfig;
}

// Interface for our custom Next.js configuration
interface CustomNextConfig extends NextConfig {
  output: 'standalone';
  serverExternalPackages: string[]; // Updated from experimental.serverComponentsExternalPackages
  webpack: WebpackConfigFunction;
}

const nextConfig: CustomNextConfig = {
  output: 'standalone',
  serverExternalPackages: ['better-sqlite3'], // Updated from experimental property
  webpack: (config: WebpackConfig): WebpackConfig => {
    // This allows the app to build even with native modules
    if (!config.externals) {
      config.externals = ['better-sqlite3'];
    } else if (Array.isArray(config.externals)) {
      config.externals.push('better-sqlite3');
    } else {
      config.externals = [config.externals, 'better-sqlite3'];
    }
    return config;
  },
}

module.exports = nextConfig