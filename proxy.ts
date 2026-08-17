import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { JOB_BOARD_ENABLED } from './app/lib/flags';

// ── Job board gate ─────────────────────────────────────────────────────────
// Job board is flag-gated, not removed — see app/lib/flags.ts. When disabled,
// these routes redirect to the CV optimiser instead of a sign-in wall.
const JOB_BOARD_ROUTES = ['/jobs', '/recruiters', '/saved-jobs', '/uk/jobs'];

function jobBoardRedirect(req: NextRequest): NextResponse | null {
  if (JOB_BOARD_ENABLED) return null;
  const { pathname } = req.nextUrl;
  if (JOB_BOARD_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    const target = pathname.startsWith('/uk') ? '/uk' : '/optimise';
    return NextResponse.redirect(new URL(target, req.url));
  }
  return null;
}

// ── UK homepage redirect ────────────────────────────────────────────────────
// The SA and UK marketing homepages were merged into one universal page at
// "/" (currency is detected client-side instead). /uk/dashboard, /uk/subscribe
// etc. are untouched — only the standalone UK marketing page redirects.
function ukHomeRedirect(req: NextRequest): NextResponse | null {
  if (req.nextUrl.pathname === '/uk') {
    return NextResponse.redirect(new URL('/', req.url));
  }
  return null;
}

const isPublicRoute = createRouteMatcher([
  '/',
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
  '/uk',
  '/uk/subscribe(.*)',
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
  '/api/payment/verify(.*)',
  '/api/data-deletion(.*)',
  '/api/admin/stats(.*)',
  '/api/admin/auth(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const jobBoardResponse = jobBoardRedirect(req);
  if (jobBoardResponse) return jobBoardResponse;

  const ukResponse = ukHomeRedirect(req);
  if (ukResponse) return ukResponse;

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
