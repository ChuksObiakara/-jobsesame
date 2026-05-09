import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Jobsesame | AI-Powered Job Search for South Africans',
  description: 'Jobsesame is an AI job platform built for South African professionals. Upload your CV and apply smarter.',
  alternates: { canonical: 'https://www.jobsesame.co.za/about' },
  openGraph: {
    title: 'About Jobsesame | AI-Powered Job Search for South Africans',
    description: 'Jobsesame is an AI job platform built for South African professionals. Upload your CV and apply smarter.',
    url: 'https://www.jobsesame.co.za/about',
    siteName: 'Jobsesame',
    locale: 'en_ZA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Jobsesame | AI-Powered Job Search for South Africans',
    description: 'Jobsesame is an AI job platform built for South African professionals. Upload your CV and apply smarter.',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
