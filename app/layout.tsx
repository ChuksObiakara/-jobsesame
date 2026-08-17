import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
import { Plus_Jakarta_Sans } from 'next/font/google';
import "./globals.css";
import CookieConsent from "./components/CookieConsent";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Jobsesame — AI CV Optimiser for Africa and the World",
  description: "Upload your CV once. Paste any job description and AI rewrites your CV in 30 seconds to pass ATS filters and get more interviews. Free for 3 rewrites.",
  metadataBase: new URL("https://jobsesame.co.za"),
  alternates: {
    canonical: "https://jobsesame.co.za",
  },
  openGraph: {
    title: "Jobsesame — AI CV Optimiser for Africa and the World",
    description: "Upload your CV once. Paste any job description and AI rewrites your CV in 30 seconds to pass ATS filters and get more interviews. Free for 3 rewrites.",
    url: "https://jobsesame.co.za",
    siteName: "Jobsesame",
    images: [
      {
        url: "https://jobsesame.co.za/og-image.png",
        width: 1200,
        height: 630,
        alt: "Jobsesame — AI CV Optimiser for Africa and the World",
      },
    ],
    locale: "en_ZA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jobsesame — AI CV Optimiser for Africa and the World",
    description: "Upload your CV once. Paste any job description and AI rewrites your CV in 30 seconds to pass ATS filters and get more interviews. Free for 3 rewrites.",
    images: ["https://jobsesame.co.za/og-image.png"],
  },
};

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
          {children}
          <CookieConsent />
        </body>
      </html>
    </ClerkProvider>
  );
}