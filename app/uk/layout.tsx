import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UK Jobs — AI-Powered Applications | Jobsesame',
  description: 'Stop getting ghosted by UK employers. Upload your CV once, AI rewrites it for every job in 30 seconds, and we auto-apply for you. Start free.',
  keywords: ['UK jobs', 'AI CV writer', 'auto apply UK', 'ATS optimisation', 'British jobs', 'job search UK', 'CV rewriter'],
  alternates: { canonical: 'https://www.jobsesame.co.za/uk' },
  openGraph: {
    title: 'UK Jobs — AI-Powered Applications | Jobsesame',
    description: 'Stop getting ghosted by UK employers. Upload your CV once, AI rewrites it for every job in 30 seconds, and we auto-apply for you.',
    url: 'https://www.jobsesame.co.za/uk',
    siteName: 'Jobsesame',
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UK Jobs — AI-Powered Applications | Jobsesame',
    description: 'Upload your CV once. AI rewrites it for every UK job. We apply for you.',
  },
};

export default function UKLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
