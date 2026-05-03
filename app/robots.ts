import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/uk', '/uk/jobs', '/uk/subscribe'],
      disallow: ['/api/', '/dashboard', '/uk/dashboard', '/admin', '/onboarding', '/payment/'],
    },
    sitemap: 'https://www.jobsesame.co.za/sitemap.xml',
  };
}
