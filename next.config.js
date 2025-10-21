/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'is1-ssl.mzstatic.com',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Ignore directories that cause EPERM errors
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/.next/**',
        '**/C:/Users/**/Application Data/**',
        '**/C:/Users/**/AppData/Local/Temp/**',
      ],
    }
    return config
  },
}

module.exports = nextConfig
