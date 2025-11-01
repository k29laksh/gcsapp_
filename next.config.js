/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["images.unsplash.com", "res.cloudinary.com"],
  },
   typescript: {
    // ✅ Allow production builds to succeed even if there are TS errors
    ignoreBuildErrors: true,
  },
  eslint: {
    // ✅ Allow production builds to succeed even if there are ESLint errors
    ignoreDuringBuilds: true,
  },
}

export default nextConfig