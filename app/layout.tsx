import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { TRPCProvider } from "@/lib/trpc/provider";
import { AuthProvider } from "@/lib/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Project Tracker",
  description: "Track student project progress",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased`}
      >
        <TRPCProvider>
          <AuthProvider>
            <div className="fixed inset-0 p-2 bg-stone-100 dark:bg-stone-950">
              <div className="flex h-full flex-col overflow-hidden rounded-xl border border-stone-200 bg-background shadow-sm dark:border-stone-800">
                {children}
              </div>
            </div>
            <Toaster />
          </AuthProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
