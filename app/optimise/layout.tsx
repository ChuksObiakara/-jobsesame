import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free CV Optimiser | Jobsesame',
  description: 'Optimise your CV for any job in 30 seconds. Free AI-powered CV rewriter for South African job seekers.',
  alternates: { canonical: 'https://www.jobsesame.co.za/optimise' },
  openGraph: {
    title: 'Free CV Optimiser | Jobsesame',
    description: 'Optimise your CV for any job in 30 seconds. Free AI-powered CV rewriter for South African job seekers.',
    url: 'https://www.jobsesame.co.za/optimise',
    siteName: 'Jobsesame',
    locale: 'en_ZA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free CV Optimiser | Jobsesame',
    description: 'Optimise your CV for any job in 30 seconds. Free AI-powered CV rewriter for South African job seekers.',
  },
};

export default function OptimiseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
