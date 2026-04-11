import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
import "./globals.css";

export const metadata: Metadata = {
  title: "Jobsesame — Open the doors to your future",
  description: "Open to the world's job market — unlocked by AI. Upload your CV once. AI matches jobs worldwide, rewrites your CV in 30 seconds, and applies automatically.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}