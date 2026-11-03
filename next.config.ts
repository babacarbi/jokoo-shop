import type { NextConfig } from "next"
import withPWAInit from "@ducanh2912/next-pwa"

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts",
          expiration: { maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-image-assets",
          expiration: { maxEntries: 64, maxAgeSeconds: 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /^https:\/\/sthpdkvglqfvvbtrwrps\.supabase\.co\/storage\/.*/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "supabase-storage",
          expiration: { maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /^https:\/\/.*\.r2\.dev\/.*/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "cloudflare-r2-images",
          expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
    ],
  },
})

const nextConfig: NextConfig = {
  turbopack: {},
  // Autoriser l'accès depuis le téléphone via IP locale
  allowedDevOrigins: ['172.20.10.6', '172.20.10.*', '192.168.*', '192.168.1.127', '192.168.1.*'],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sthpdkvglqfvvbtrwrps.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "pub-bfe6516b4d834b9da9b2ef39dcd6ea60.r2.dev",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
    ],
  },
}

export default withPWA(nextConfig)
