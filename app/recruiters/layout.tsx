import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Post Jobs and Find Talent | Jobsesame for Recruiters',
  description: 'Reach thousands of qualified candidates worldwide. Post your job on Jobsesame today.',
  alternates: { canonical: 'https://www.jobsesame.co/recruiters' },
  openGraph: {
    title: 'Post Jobs and Find Talent | Jobsesame for Recruiters',
    description: 'Reach thousands of qualified candidates worldwide. Post your job on Jobsesame today.',
    url: 'https://www.jobsesame.co/recruiters',
    siteName: 'Jobsesame',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Post Jobs and Find Talent | Jobsesame for Recruiters',
    description: 'Reach thousands of qualified candidates worldwide. Post your job on Jobsesame today.',
  },
};

export default function RecruitersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
