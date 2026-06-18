/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: '/StrataLedger',
  assetPrefix: '/StrataLedger/',
};

export default nextConfig;
