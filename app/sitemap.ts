import { MetadataRoute } from 'next';

const BASE = 'https://www.jobsesame.co.za';

const BLOG_SLUGS = [
  'cv-writing-tips-get-more-interviews',
  'ats-systems-explained',
  'how-to-get-a-job-in-london',
  'teaching-english-in-asia',
  'salary-negotiation-tips',
  'remote-work-guide-for-africans',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE,                          lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/jobs`,                lastModified: now, changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${BASE}/uk`,                  lastModified: now, changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/uk/jobs`,             lastModified: now, changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${BASE}/uk/subscribe`,        lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/blog`,                lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/about`,               lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/recruiters`,          lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/privacy`,             lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/terms`,               lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/refund`,              lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ];

  const blogRoutes: MetadataRoute.Sitemap = BLOG_SLUGS.map(slug => ({
    url: `${BASE}/blog/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...blogRoutes];
}
