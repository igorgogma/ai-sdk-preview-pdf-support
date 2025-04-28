/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable development indicators (including "Static route" indicator)
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
    staticRouteIndicator: false,
  }
};

export default nextConfig;
