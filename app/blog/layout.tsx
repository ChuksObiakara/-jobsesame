import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Job Search Tips and Career Advice | Jobsesame Blog',
  description: 'Career advice, CV tips, and job search strategies for job seekers everywhere.',
  alternates: { canonical: 'https://www.jobsesame.co.za/blog' },
  openGraph: {
    title: 'Job Search Tips and Career Advice | Jobsesame Blog',
    description: 'Career advice, CV tips, and job search strategies for job seekers everywhere.',
    url: 'https://www.jobsesame.co.za/blog',
    siteName: 'Jobsesame',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Job Search Tips and Career Advice | Jobsesame Blog',
    description: 'Career advice, CV tips, and job search strategies for job seekers everywhere.',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
