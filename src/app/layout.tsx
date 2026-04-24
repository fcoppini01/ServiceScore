import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SessionProvider } from "@/components/session-provider";

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://servicescore.vercel.app"),
  title: {
    default: "ServiceScore - Lions Club 108 LA",
    template: "%s | ServiceScore"
  },
  description: "Sistema gestionale per i Lions Club Distretto 108 LA",
  icons: {
    icon: "/logo_ufficiale.png",
    shortcut: "/logo_ufficiale.png",
    apple: "/logo_ufficiale.png",
  },
  openGraph: {
    title: "ServiceScore - Lions Club",
    description: "Sistema gestionale per i Lions Club Distretto 108 LA",
    url: "https://servicescore.vercel.app",
    siteName: "ServiceScore",
    images: [
      {
        url: "/logo_ufficiale.png",
        width: 1200,
        height: 630,
        alt: "Lions Club Logo",
      },
    ],
    locale: "it_IT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ServiceScore - Lions Club",
    description: "Sistema gestionale per i Lions Club Distretto 108 LA",
    images: ["/logo_ufficiale.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      suppressHydrationWarning
      className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gradient-to-br from-background via-muted/20 to-background antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SessionProvider>
            <div className="min-h-screen flex flex-col backdrop-blur-sm">
              <Header />
              <main className="flex-1 relative">
                {/* Effetto luce MAC */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
                {children}
              </main>
              <Footer />
            </div>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
