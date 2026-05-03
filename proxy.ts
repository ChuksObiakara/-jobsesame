import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ── Geo-redirect helper ───────────────────────────────────────────────────────
function geoRedirect(req: NextRequest): NextResponse | null {
  const { pathname } = req.nextUrl;

  // Never touch API routes, _next, or static assets
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    /\.(?:ico|png|jpg|jpeg|svg|webp|gif|css|js|woff2?)$/.test(pathname)
  ) return null;

  // Explicit cookie wins over geo detection
  const marketCookie = req.cookies.get('jobsesame_market')?.value;
  if (marketCookie) return null;

  const country = req.headers.get('x-vercel-ip-country') || '';

  if (country === 'GB' && pathname === '/') {
    const res = NextResponse.redirect(new URL('/uk', req.url));
    res.cookies.set('jobsesame_market', 'GB', { path: '/', maxAge: 60 * 60 * 24 * 30, sameSite: 'lax' });
    return res;
  }

  if (country === 'ZA' && pathname === '/uk') {
    const res = NextResponse.redirect(new URL('/', req.url));
    res.cookies.set('jobsesame_market', 'ZA', { path: '/', maxAge: 60 * 60 * 24 * 30, sameSite: 'lax' });
    return res;
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
  const geoResponse = geoRedirect(req);
  if (geoResponse) return geoResponse;

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
