import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UK Jobs for South Africans | Jobsesame',
  description: 'Find and auto-apply to UK jobs from South Africa. AI rewrites your CV for every UK application in 30 seconds.',
  keywords: ['UK jobs', 'AI CV writer', 'auto apply UK', 'ATS optimisation', 'British jobs', 'job search UK', 'CV rewriter'],
  alternates: { canonical: 'https://www.jobsesame.co.za/uk' },
  openGraph: {
    title: 'UK Jobs for South Africans | Jobsesame',
    description: 'Find and auto-apply to UK jobs from South Africa. AI rewrites your CV for every UK application in 30 seconds.',
    url: 'https://www.jobsesame.co.za/uk',
    siteName: 'Jobsesame',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UK Jobs for South Africans | Jobsesame',
    description: 'Find and auto-apply to UK jobs from South Africa. AI rewrites your CV for every UK application in 30 seconds.',
  },
};

export default function UKLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
