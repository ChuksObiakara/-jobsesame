import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse UK Jobs | Jobsesame UK',
  description: 'Browse 200+ UK jobs matched to your CV. One-click auto-apply to UK employers.',
  keywords: ['UK jobs board', 'UK job listings', 'apply to UK jobs', 'AI job applications UK'],
  alternates: { canonical: 'https://www.jobsesame.co.za/uk/jobs' },
  openGraph: {
    title: 'Browse UK Jobs | Jobsesame UK',
    description: 'Browse 200+ UK jobs matched to your CV. One-click auto-apply to UK employers.',
    url: 'https://www.jobsesame.co.za/uk/jobs',
    siteName: 'Jobsesame',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse UK Jobs | Jobsesame UK',
    description: 'Browse 200+ UK jobs matched to your CV. One-click auto-apply to UK employers.',
  },
};

export default function UKJobsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
