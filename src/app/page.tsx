import type { Metadata } from "next";
import { EarthLock } from "lucide-react";
import Converter from "@/components/Converter";

export const metadata: Metadata = {
  title: "LocalDrop - Convert HEIC to JPG. Offline. Private. Free.",
  description: "Your photos never leave your browser. The only converter that doesn't track you.",
  keywords: ["HEIC to JPG converter", "Free offline converter", "iPhone photo converter", "HEIC converter", "privacy-first converter"],
};

export default function Home() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-dark">
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
                    HEIC Converter
                  </h1>
                  <p className="text-base md:text-lg font-normal leading-normal max-w-lg mx-auto text-text-secondary-dark">
                    Privacy first. Convert your HEIC images to JPG or PNG securely on your device. No uploads, ever.
                  </p>
                </div>
              </div>

              {/* Converter Component */}
              <div className="mt-8">
                <Converter />
              </div>
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

