import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | Jobsesame',
  description: 'Get in touch with the Jobsesame team — questions, billing issues, or feedback.',
  alternates: { canonical: 'https://www.jobsesame.co/contact' },
  openGraph: {
    title: 'Contact Us | Jobsesame',
    description: 'Get in touch with the Jobsesame team — questions, billing issues, or feedback.',
    url: 'https://www.jobsesame.co/contact',
    siteName: 'Jobsesame',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Us | Jobsesame',
    description: 'Get in touch with the Jobsesame team — questions, billing issues, or feedback.',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
