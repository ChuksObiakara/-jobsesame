import { redirect } from 'next/navigation';

// The SA and UK marketing homepages were merged into one universal page at
// "/" — proxy.ts already redirects /uk there at the middleware level. This
// is just a server-side fallback for any request that reaches the route
// handler directly.
export default function UKPage() {
  redirect('/');
}
