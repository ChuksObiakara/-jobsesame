import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
import "./globals.css";

export const metadata: Metadata = {
  title: "Jobsesame — AI Job Platform for Africa and the World",
  description: "Upload your CV once. AI rewrites it for every job. Quick Apply to millions of jobs worldwide. Free for 3 applications.",
  metadataBase: new URL("https://jobsesame.co.za"),
  alternates: {
    canonical: "https://jobsesame.co.za",
  },
  openGraph: {
    title: "Jobsesame — AI Job Platform for Africa and the World",
    description: "Upload your CV once. AI rewrites it for every job. Quick Apply to millions of jobs worldwide. Free for 3 applications.",
    url: "https://jobsesame.co.za",
    siteName: "Jobsesame",
    images: [
      {
        url: "https://jobsesame.co.za/og-image.png",
        width: 1200,
        height: 630,
        alt: "Jobsesame — AI Job Platform for Africa and the World",
      },
    ],
    locale: "en_ZA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jobsesame — AI Job Platform for Africa and the World",
    description: "Upload your CV once. AI rewrites it for every job. Quick Apply to millions of jobs worldwide. Free for 3 applications.",
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
      afterSignInUrl="/onboarding"
      afterSignUpUrl="/onboarding"
    >
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}