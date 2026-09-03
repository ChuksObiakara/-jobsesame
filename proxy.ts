import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { JOB_BOARD_ENABLED } from './app/lib/flags';

// ── Job board gate ─────────────────────────────────────────────────────────
// Job board is flag-gated, not removed — see app/lib/flags.ts. When disabled,
// this route redirects to the CV optimiser instead of a sign-in wall.
const JOB_BOARD_ROUTES = ['/jobs', '/recruiters', '/saved-jobs'];

function jobBoardRedirect(req: NextRequest): NextResponse | null {
  if (JOB_BOARD_ENABLED) return null;
  const { pathname } = req.nextUrl;
  if (JOB_BOARD_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    return NextResponse.redirect(new URL('/optimise', req.url));
  }
  return null;
}

// ── UK route retirement ─────────────────────────────────────────────────────
// SA and UK used to be two parallel sites (separate homepages, dashboards,
// job boards, and a UKSubscription billing table). It's now one universal
// product for every market — currency is detected client-side instead. These
// redirects catch anyone with an old /uk/... bookmark or link.
const UK_ROUTE_REDIRECTS: Record<string, string> = {
  '/uk': '/',
  '/uk/dashboard': '/dashboard',
  '/uk/jobs': '/jobs',
  '/uk/subscribe': '/dashboard',
  '/uk/onboarding': '/onboarding',
};

function ukRouteRedirect(req: NextRequest): NextResponse | null {
  const { pathname } = req.nextUrl;
  let target = UK_ROUTE_REDIRECTS[pathname]
    ?? (pathname.startsWith('/uk/') ? '/' : null);
  if (!target) return null;
  // Avoid a double redirect when the unified target is itself job-board-gated.
  if (target === '/jobs' && !JOB_BOARD_ENABLED) target = '/optimise';
  return NextResponse.redirect(new URL(target, req.url));
}

const isPublicRoute = createRouteMatcher([
  '/',
  '/robots.txt',
  '/sitemap.xml',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sso-callback(.*)',
  '/blog(.*)',
  '/about',
  '/recruiters',
  '/privacy',
  '/terms',
  '/refund',
  '/delete-data',
  '/unsubscribe',
  '/payment/success',
  '/optimise',
  '/api/jobs(.*)',
  '/api/jsearch(.*)',
  '/api/adzuna(.*)',
  '/api/remote(.*)',
  '/api/relocation(.*)',
  '/api/teaching(.*)',
  '/api/south-africa(.*)',
  '/api/africa(.*)',
  '/api/arbeitnow(.*)',
  '/api/lever(.*)',
  '/api/greenhouse(.*)',
  '/api/cv(.*)',
  '/api/cv-test(.*)',
  '/api/cv-check(.*)',
  '/api/payment/verify(.*)',
  '/api/data-deletion(.*)',
  '/api/admin/stats(.*)',
  '/api/admin/auth(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const ukResponse = ukRouteRedirect(req);
  if (ukResponse) return ukResponse;

  const jobBoardResponse = jobBoardRedirect(req);
  if (jobBoardResponse) return jobBoardResponse;

  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
