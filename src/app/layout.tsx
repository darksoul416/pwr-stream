import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ServiceWorkerRegister } from "@/components/pwr/service-worker-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pwr-stream.example.com"),
  title: "PWR Stream — Watch Anime, Movies & TV",
  description:
    "Stream anime, movies and TV shows in one place. A YouTube-style streaming platform with PWR flair.",
  keywords: [
    "anime",
    "movies",
    "tv shows",
    "streaming",
    "watch online",
    "PWR",
    "free movies",
    "free anime",
  ],
  authors: [{ name: "PWR Stream" }],
  applicationName: "PWR Stream",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "PWR Stream",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/icon.svg"],
  },
  openGraph: {
    title: "PWR Stream — Watch Anime, Movies & TV",
    description:
      "Stream anime, movies and TV shows free. YouTube-style streaming platform.",
    type: "website",
    siteName: "PWR Stream",
    images: ["/icons/icon-512.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "PWR Stream",
    description: "Stream anime, movies and TV shows free.",
    images: ["/icons/icon-512.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#7c3aed" },
    { media: "(prefers-color-scheme: light)", color: "#7c3aed" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* iOS PWA meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="PWR Stream" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="default"
        />
        {/* Android Chrome */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="PWR Stream" />
        {/* Safe area insets for notched phones */}
        <style>{`
          html {
            --sat: env(safe-area-inset-top);
            --sab: env(safe-area-inset-bottom);
            --sal: env(safe-area-inset-left);
            --sar: env(safe-area-inset-right);
          }
        `}</style>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
