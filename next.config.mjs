/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',          // Enables static export (`next export`)
  trailingSlash: true,       // Ensures proper file paths in Firebase
  images: {
    unoptimized: true,       // Disables Next.js Image Optimization (Firebase handles this)
  },
};

export default nextConfig;