import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/onboarding(.*)',
  '/sso-callback(.*)',
  '/api/jobs(.*)',
  '/api/remote(.*)',
  '/api/relocation(.*)',
  '/api/referral(.*)',
  '/api/cv(.*)',
  '/api/rewrite(.*)',
  '/api/download-cv(.*)',
  '/api/payment(.*)',
  '/payment(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();
  const url = request.nextUrl.clone();
  const path = url.pathname;

  // Signed-in users on sign-in, sign-up, or homepage → send to onboarding.
  // The onboarding page itself checks localStorage and skips to /dashboard
  // for users who already completed it.
  if (userId && (
    path === '/' ||
    path === '/sign-in' || path.startsWith('/sign-in/') ||
    path === '/sign-up' || path.startsWith('/sign-up/')
  )) {
    url.pathname = '/onboarding';
    return NextResponse.redirect(url);
  }

  // Unauthenticated users accessing protected routes → sign-in
  if (!userId && !isPublicRoute(request)) {
    url.pathname = '/sign-in';
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
