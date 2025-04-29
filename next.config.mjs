/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable development indicators (including "Static route" indicator)
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
    staticRouteIndicator: false,
  },
  // Exclude client directory from the build
  serverExternalPackages: [],
  // Ignore TypeScript errors in client directory
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ignore ESLint errors
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Explicitly set output directory
  distDir: '.next',
  // Clean destination directory before build
  cleanDistDir: true,
  // Exclude specific directories from the build
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  // Disable source maps in production
  productionBrowserSourceMaps: false,
};

export default nextConfig;
