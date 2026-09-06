import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs/config';
const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: false },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }],
  },
  async redirects() {
    return [
      // Canonicalize on www — every page's metadata, the sitemap, and
      // robots.txt already assume www.jobsesame.co.za is the canonical host.
      // Without this, both hosts served the same content with no redirect,
      // splitting SEO authority between two "different" URLs for every page.
      // /api/* is deliberately excluded: payment (Lemon Squeezy) and other
      // webhooks may be registered against a specific host, and POST
      // requests to a redirected URL are not reliably retried by every
      // webhook sender — only user-facing pages get canonicalized.
      {
        source: '/:path((?!api/).*)',
        has: [{ type: 'host', value: 'jobsesame.co.za' }],
        destination: 'https://www.jobsesame.co.za/:path',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

// withSentryConfig only uploads source maps (for readable stack traces)
// when SENTRY_AUTH_TOKEN/SENTRY_ORG/SENTRY_PROJECT are set — until those
// exist it just skips that step and builds normally, so this is safe to
// ship ahead of the Sentry project being created.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  widenClientFileUpload: true,
});
