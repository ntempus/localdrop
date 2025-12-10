import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://localdrop.jaid.dev'),
  title: 'LocalDrop | Secure, Free & Private HEIC to JPG Converter',
  description: 'The fastest way to convert HEIC to JPG in your browser. No server uploads, offline capable, and 100% private. Convert for Free.',
  openGraph: {
    title: 'LocalDrop | Secure, Free & Private HEIC to JPG Converter',
    description: 'The fastest way to convert HEIC to JPG in your browser. No server uploads, offline capable, and 100% private. Convert for Free.',
    url: 'https://localdrop.jaid.dev',
    siteName: 'LocalDrop',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LocalDrop - Secure HEIC Converter',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LocalDrop | Secure, Free & Private HEIC to JPG Converter',
    description: 'The fastest way to convert HEIC to JPG in your browser. No server uploads, offline capable, and 100% private. Convert for Free.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

