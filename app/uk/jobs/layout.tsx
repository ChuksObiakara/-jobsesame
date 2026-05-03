import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UK Jobs Board | Jobsesame',
  description: 'Browse and apply to UK jobs with AI-powered applications. AI rewrites your CV for every role in 30 seconds.',
  keywords: ['UK jobs board', 'UK job listings', 'apply to UK jobs', 'AI job applications UK'],
  alternates: { canonical: 'https://www.jobsesame.co.za/uk/jobs' },
  openGraph: {
    title: 'UK Jobs Board | Jobsesame',
    description: 'Browse and apply to UK jobs with AI-powered applications.',
    url: 'https://www.jobsesame.co.za/uk/jobs',
    siteName: 'Jobsesame',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UK Jobs Board | Jobsesame',
    description: 'Browse and apply to UK jobs with AI-powered applications.',
  },
};

export default function UKJobsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
