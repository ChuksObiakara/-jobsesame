import { MetadataRoute } from 'next';
import { POSTS } from './blog/posts';
import { JOB_BOARD_ENABLED } from './lib/flags';

const BASE = 'https://www.jobsesame.co';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE,                          lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    // NOTE: /uk, /uk/jobs, /uk/subscribe were previously listed here but no
    // such routes exist in the app — they 404. Removed to stop submitting
    // dead links to Google. If a UK section is meant to be built, add it
    // back here once the routes actually exist.
    //
    // /jobs and /recruiters are the job-board feature, which is switched
    // off for this launch (JOB_BOARD_ENABLED=false) — Nav, Footer,
    // Dashboard and Account all already hide every link to them under the
    // same flag. This sitemap was still submitting both to Google
    // unconditionally, which would get an unlaunched, unlinked feature
    // indexed and crawled ahead of the site's own nav ever pointing to it.
    ...(JOB_BOARD_ENABLED ? [
      { url: `${BASE}/jobs`,       lastModified: now, changeFrequency: 'hourly' as const,  priority: 0.9 },
      { url: `${BASE}/recruiters`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.5 },
    ] : []),
    { url: `${BASE}/optimise`,            lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/blog`,                lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/about`,               lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/contact`,             lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/privacy`,             lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/terms`,               lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/refund`,              lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ];

  // Generated from the actual post list so newly added posts are never
  // silently missing from the sitemap again (6 published posts were
  // previously omitted here).
  const blogRoutes: MetadataRoute.Sitemap = POSTS.map(post => ({
    url: `${BASE}/blog/${post.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...blogRoutes];
}
