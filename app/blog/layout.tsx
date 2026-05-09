import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Job Search Tips and Career Advice | Jobsesame Blog',
  description: 'Career advice, CV tips, and job search strategies for South African professionals.',
  alternates: { canonical: 'https://www.jobsesame.co.za/blog' },
  openGraph: {
    title: 'Job Search Tips and Career Advice | Jobsesame Blog',
    description: 'Career advice, CV tips, and job search strategies for South African professionals.',
    url: 'https://www.jobsesame.co.za/blog',
    siteName: 'Jobsesame',
    locale: 'en_ZA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Job Search Tips and Career Advice | Jobsesame Blog',
    description: 'Career advice, CV tips, and job search strategies for South African professionals.',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
