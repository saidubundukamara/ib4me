import {withSentryConfig} from '@sentry/nextjs';
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  org: "ib4me",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  widenClientFileUpload: false,
  tunnelRoute: "/monitoring",
  disableLogger: true,
  automaticVercelMonitors: true,
  // This project uses App Router only — disable Pages Router instrumentation
  // to prevent "Cannot find module for page: /_error" errors during build.
  autoInstrumentServerFunctions: false,
});