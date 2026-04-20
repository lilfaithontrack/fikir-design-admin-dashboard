/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['res.cloudinary.com', 'localhost'],
  },
  // Exclude mobile app from build
  experimental: {
    outputFileTracingExcludes: {
      '*': ['**/Mobile app/**/*'],
    },
  },
}

module.exports = nextConfig
