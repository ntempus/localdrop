import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: 'LocalDrop | Private HEIC to JPG Converter',
  description: 'Convert iPhone photos to JPG instantly in your browser. No server uploads. 100% Private.',
  openGraph: {
    images: ['/og-image.png'],
  },
  metadataBase: new URL('https://localdrop.vercel.app'),
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

