/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    QN_DEVNET: process.env.QN_DEVNET,
  }
}

module.exports = nextConfig
