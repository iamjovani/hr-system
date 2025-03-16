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
  serverExternalPackages: string[];
  webpack: WebpackConfigFunction;
}

const nextConfig: CustomNextConfig = {
  output: 'standalone',
  // Changed from serverComponentsExternalPackages to serverExternalPackages
  serverExternalPackages: ['better-sqlite3'],
  
  // Add this for better SQLite support
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