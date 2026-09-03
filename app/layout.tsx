import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
import { Plus_Jakarta_Sans } from 'next/font/google';
import "./globals.css";
import CookieConsent from "./components/CookieConsent";
import PostHogProvider from "./components/PostHogProvider";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Jobsesame — AI CV Optimiser for Every Job Application",
  description: "Upload your CV once. Paste any job description and AI rewrites your CV in 30 seconds to pass ATS filters and get more interviews. Free for 3 rewrites.",
  metadataBase: new URL("https://www.jobsesame.co.za"),
  alternates: {
    canonical: "https://www.jobsesame.co.za",
  },
  openGraph: {
    title: "Jobsesame — AI CV Optimiser for Every Job Application",
    description: "Upload your CV once. Paste any job description and AI rewrites your CV in 30 seconds to pass ATS filters and get more interviews. Free for 3 rewrites.",
    url: "https://www.jobsesame.co.za",
    siteName: "Jobsesame",
    images: [
      {
        url: "https://www.jobsesame.co.za/og-image.png",
        width: 1200,
        height: 630,
        alt: "Jobsesame — AI CV Optimiser for Every Job Application",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jobsesame — AI CV Optimiser for Every Job Application",
    description: "Upload your CV once. Paste any job description and AI rewrites your CV in 30 seconds to pass ATS filters and get more interviews. Free for 3 rewrites.",
    images: ["https://www.jobsesame.co.za/og-image.png"],
  },
};

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Jobsesame',
    url: 'https://www.jobsesame.co.za',
    logo: 'https://www.jobsesame.co.za/og-image.png',
    sameAs: [],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Jobsesame',
    url: 'https://www.jobsesame.co.za',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://www.jobsesame.co.za/blog?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      afterSignOutUrl="/"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/onboarding"
    >
      <html lang="en" className={plusJakarta.className}>
        <body>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
          <PostHogProvider>{children}</PostHogProvider>
          <CookieConsent />
        </body>
      </html>
    </ClerkProvider>
  );
}