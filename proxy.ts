import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

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
