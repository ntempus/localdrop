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
  title: 'LocalDrop | Private HEIC to JPG Converter',
  description: 'LocalDrop is the fastest, most secure way to convert HEIC photos to JPG directly in your browser. No server uploads, offline capable, and 100% private. Free forever.',
  openGraph: {
    title: 'LocalDrop | Private HEIC to JPG Converter',
    description: 'LocalDrop is the fastest, most secure way to convert HEIC photos to JPG directly in your browser. No server uploads, offline capable, and 100% private. Free forever.',
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
    title: 'LocalDrop | Private HEIC to JPG Converter',
    description: 'LocalDrop is the fastest, most secure way to convert HEIC photos to JPG directly in your browser. No server uploads, offline capable, and 100% private. Free forever.',
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

