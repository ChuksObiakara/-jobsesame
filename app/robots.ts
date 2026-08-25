import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/'],
      disallow: ['/api/', '/dashboard', '/admin', '/onboarding', '/payment/', '/saved-jobs'],
    },
    sitemap: 'https://www.jobsesame.co.za/sitemap.xml',
  };
}
