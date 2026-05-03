import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UK Dashboard | Jobsesame',
  description: 'Manage your UK job applications, track status, and use AI tools from your dashboard.',
  robots: { index: false, follow: false },
};

export default function UKDashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
