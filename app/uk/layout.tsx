import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UK Jobs | Jobsesame',
  description: 'Find and auto-apply to UK jobs. AI rewrites your CV for every application.',
  alternates: { canonical: 'https://jobsesame.co.za/uk' },
  openGraph: {
    title: 'UK Jobs | Jobsesame',
    description: 'Find and auto-apply to UK jobs. AI rewrites your CV for every application.',
    url: 'https://jobsesame.co.za/uk',
    siteName: 'Jobsesame',
    locale: 'en_GB',
    type: 'website',
  },
};

export default function UKLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
