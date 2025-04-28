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
};

export default nextConfig;
