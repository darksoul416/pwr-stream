import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ServiceWorkerRegister } from "@/components/pwr/service-worker-register";
import { PopupBlocker } from "@/components/pwr/popup-blocker";
import { AuthProvider } from "@/components/auth/auth-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mobiman.example.com"),
  title: "Mobiman — Watch Anime, Movies & TV",
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
  authors: [{ name: "Mobiman" }],
  applicationName: "Mobiman",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Mobiman",
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
    title: "Mobiman — Watch Anime, Movies & TV",
    description:
      "Stream anime, movies and TV shows free. YouTube-style streaming platform.",
    type: "website",
    siteName: "Mobiman",
    images: ["/icons/icon-512.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mobiman",
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
        <meta name="apple-mobile-web-app-title" content="Mobiman" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="default"
        />
        {/* Android Chrome */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Mobiman" />
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
        {/* JSON-LD Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Mobiman",
              url: "https://mobiman.vercel.app",
              description:
                "Stream anime, movies and TV shows free. YouTube-style streaming platform with PWR flair.",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate:
                    "https://mobiman.vercel.app/?q={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        {/* Cloudflare Web Analytics (privacy-friendly, no cookies, free) */}
        {/* Get your beacon ID at https://www.cloudflare.com/web-analytics/ */}
        {process.env.NEXT_PUBLIC_CF_ANALYTICS && (
          <script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={`{"token": "${process.env.NEXT_PUBLIC_CF_ANALYTICS}"}`}
          />
        )}
        {/* Microsoft Clarity (free session replay + heatmaps) */}
        {/* Get your project ID at https://clarity.microsoft.com/ */}
        {process.env.NEXT_PUBLIC_CLARITY_ID && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_ID}");`,
            }}
          />
        )}
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
        <ServiceWorkerRegister />
        <PopupBlocker />
      </body>
    </html>
  );
}
