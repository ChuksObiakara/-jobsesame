import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Find Jobs | Jobsesame',
  description: 'Browse thousands of jobs worldwide. AI rewrites your CV for every application in 30 seconds. Free to start.',
  alternates: { canonical: 'https://www.jobsesame.co.za/jobs' },
  openGraph: {
    title: 'Find Jobs | Jobsesame',
    description: 'Browse thousands of jobs worldwide. AI rewrites your CV for every application in 30 seconds. Free to start.',
    url: 'https://www.jobsesame.co.za/jobs',
    siteName: 'Jobsesame',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Find Jobs | Jobsesame',
    description: 'Browse thousands of jobs worldwide. AI rewrites your CV for every application in 30 seconds. Free to start.',
  },
};

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
