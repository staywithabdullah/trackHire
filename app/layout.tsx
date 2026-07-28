import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import NavigationProgress from "@/components/navigation-progress";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://checktrackhire.vercel.app"),
  title: {
    default: "TrackHire",
    template: "%s | TrackHire",
  },
  description: "Organize, track, and manage all your job applications in one seamless dashboard.",
  keywords: ["job tracker", "career management", "job applications", "track jobs", "resume manager"],
  authors: [{ name: "Abdullah Al Masud Bhuiyan" }],
  creator: "Abdullah Al Masud Bhuiyan",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://checktrackhire.vercel.app",
    title: "TrackHire - Job Application Tracker",
    description: "Organize, track, and manage all your job applications in one seamless dashboard.",
    siteName: "TrackHire",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "TrackHire Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TrackHire - Job Application Tracker",
    description: "Organize, track, and manage all your job applications in one seamless dashboard.",
    creator: "@trackhire",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <ThemeProvider>
          <NavigationProgress />
          {children}
          <Toaster position="top-right" closeButton richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
