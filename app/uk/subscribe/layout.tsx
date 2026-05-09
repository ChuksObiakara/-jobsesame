import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Subscribe to UK Jobs Access | Jobsesame',
  description: 'Get access to UK jobs from £10. Apply to UK employers with an AI-optimised CV.',
  alternates: { canonical: 'https://www.jobsesame.co.za/uk/subscribe' },
  openGraph: {
    title: 'Subscribe to UK Jobs Access | Jobsesame',
    description: 'Get access to UK jobs from £10. Apply to UK employers with an AI-optimised CV.',
    url: 'https://www.jobsesame.co.za/uk/subscribe',
    siteName: 'Jobsesame',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Subscribe to UK Jobs Access | Jobsesame',
    description: 'Get access to UK jobs from £10. Apply to UK employers with an AI-optimised CV.',
  },
};

export default function UKSubscribeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
