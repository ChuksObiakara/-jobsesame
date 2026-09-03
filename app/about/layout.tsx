import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Jobsesame | AI-Powered Job Search for Everyone',
  description: 'Jobsesame is an AI job platform built to help professionals everywhere apply smarter, wherever they are.',
  alternates: { canonical: 'https://www.jobsesame.co.za/about' },
  openGraph: {
    title: 'About Jobsesame | AI-Powered Job Search for Everyone',
    description: 'Jobsesame is an AI job platform built to help professionals everywhere apply smarter, wherever they are.',
    url: 'https://www.jobsesame.co.za/about',
    siteName: 'Jobsesame',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Jobsesame | AI-Powered Job Search for Everyone',
    description: 'Jobsesame is an AI job platform built to help professionals everywhere apply smarter, wherever they are.',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
