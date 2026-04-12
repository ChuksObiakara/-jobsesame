import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
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

  // If signed in and on sign-in or sign-up page — redirect to dashboard
  if (userId && (path === '/sign-in' || path.startsWith('/sign-in/') || path === '/sign-up' || path.startsWith('/sign-up/'))) {
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // If not signed in and trying to access protected routes — redirect to sign-in
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
