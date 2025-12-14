import type { Metadata } from "next";
import { EarthLock } from "lucide-react";
import Converter from "@/components/Converter";

export const metadata: Metadata = {
  title: "Free HEIC to JPG Converter - Online, Secure & Fast | LocalDrop",
  description: "Convert HEIC photos to JPG/PNG instantly in your browser. Free, private, and works offline. The best online tool for iPhone image conversion.",
  keywords: ["HEIC to JPG", "convert HEIC to JPG", "HEIC converter online", "free HEIC converter", "iPhone photo converter", "HEIC to PNG", "secure image converter"],
};

export default function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'LocalDrop',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: 'Free online HEIC to JPG converter. Secure, private, and offline capable.',
    featureList: 'Offline conversion, Privacy-focused, Batch processing, Drag and drop',
    screenshot: 'https://localdrop.jaid.dev/og-image.png',
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-dark">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex h-full grow flex-col">
        <div className="px-4 md:px-10 lg:px-20 xl:px-40 flex flex-1 justify-center py-5">
          <div className="flex flex-col w-full max-w-3xl flex-1">
            {/* Header */}
            <header className="flex items-center justify-between whitespace-nowrap px-4 md:px-6 py-4">
              <div className="flex items-center gap-3 text-text-primary-dark">
                <div className="text-text-primary-dark">
                  <EarthLock className="w-6 h-6" />
                </div>
                <h2 className="text-base font-semibold leading-tight">LocalDrop</h2>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow p-4">
              <div className="flex flex-wrap justify-between gap-3 pt-12 pb-6">
                <div className="flex flex-col gap-3 w-full text-center">
                  <h1 className="text-text-primary-dark text-4xl md:text-5xl font-bold leading-tight tracking-tighter">
                    Free Online HEIC to JPG Converter
                  </h1>
                  <p className="text-base md:text-lg font-normal leading-normal max-w-lg mx-auto text-text-secondary-dark">
                    Privacy first. Convert your HEIC images to JPG or PNG securely on your device. No uploads, ever.
                  </p>
                </div>
              </div>

              {/* Converter Component */}
              <div className="mt-8 mb-16">
                <Converter />
              </div>

              {/* SEO Content Sections */}
              <section className="space-y-12 text-text-primary-dark">
                <article className="space-y-4">
                  <h2 className="text-2xl font-bold tracking-tight">How to Convert HEIC to JPG Online?</h2>
                  <div className="text-text-secondary-dark space-y-2">
                    <p>Converting your iPhone photos to widely compatible formats has never been easier. LocalDrop provides a simple, secure solution:</p>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>Drag and drop your <strong>HEIC files</strong> into the box above.</li>
                      <li>Select your desired output format (JPG or PNG).</li>
                      <li>Wait for the secure, local conversion to finish.</li>
                      <li>Download your converted images instantly.</li>
                    </ol>
                  </div>
                </article>

                <article className="space-y-4">
                  <h2 className="text-2xl font-bold tracking-tight">Why Choose LocalDrop?</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                      <h3 className="text-lg font-semibold mb-2">🔒 100% Private</h3>
                      <p className="text-text-secondary-dark text-sm">Your photos never leave your device. All processing happens locally in your browser, ensuring maximum security for your personal images.</p>
                    </div>
                    <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                      <h3 className="text-lg font-semibold mb-2">⚡ Lightning Fast</h3>
                      <p className="text-text-secondary-dark text-sm">No upload or download times. Efficient local processing means your conversions happen instantly, saving you time and data.</p>
                    </div>
                    <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                      <h3 className="text-lg font-semibold mb-2">💻 Works Offline</h3>
                      <p className="text-text-secondary-dark text-sm">Once loaded, LocalDrop works without an internet connection. Perfect for converting photos on the go.</p>
                    </div>
                    <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                      <h3 className="text-lg font-semibold mb-2">🆓 Completely Free</h3>
                      <p className="text-text-secondary-dark text-sm">No hidden fees, no watermarks, and no limits on the number of files you can convert.</p>
                    </div>
                  </div>
                </article>

                <article className="space-y-4">
                  <h2 className="text-2xl font-bold tracking-tight">Frequently Asked Questions</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-1">What is a HEIC file?</h3>
                      <p className="text-text-secondary-dark">HEIC (High Efficiency Image Container) is the default image format for photos on iPhones and iPads. While it offers high quality at smaller file sizes, it's not supported by all devices and software.</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-1">Is it safe to convert photos online?</h3>
                      <p className="text-text-secondary-dark">Most online converters upload your files to a server. <strong>LocalDrop is different.</strong> We process everything locally in your browser, so your private photos never touch our servers.</p>
                    </div>
                  </div>
                </article>
              </section>
            </main>

            {/* Footer */}
            <footer className="text-center p-8 mt-12">
              <p className="text-xs text-text-tertiary-dark">© 2024 LocalDrop. All Rights Reserved.</p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}

