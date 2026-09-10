import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Cursor } from "@repo/ui/cursor";
import { Nav } from "./components/nav";
import { Providers } from "@repo/ui/providers";
import { SmoothScroll } from "@repo/ui/smooth-scroll";
import { Preloader } from "@repo/ui/preloader";
import { ScrollProgress } from "@repo/ui/scroll-progress";
import { ACCENT_BOOT_SCRIPT } from "@repo/ui/theme-boot";
import { SITE_URL } from "./lib/site";
import "lenis/dist/lenis.css";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

const description =
  "Scan any barcode and read the nutrition label in plain language, checked by the community. Free, open-source, and built for the products on Indian shelves.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "TrueLabel — Know what you eat", template: "%s · TrueLabel" },
  description,
  openGraph: {
    title: "TrueLabel — Know what you eat",
    description,
    siteName: "TrueLabel",
    type: "website",
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#f6f6f4" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          // Runs before paint so a stored light-mode preference doesn't
          // flash dark first — the class starts as "dark" in the static
          // markup above (dark-mode-first default) and this corrects it.
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('theme')==='light'){document.documentElement.classList.remove('dark')}}catch(e){}" + ACCENT_BOOT_SCRIPT,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} bg-bg text-fg antialiased`}>
        <Providers>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[300] focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-ink"
          >
            Skip to content
          </a>
          <Preloader />
          <Cursor />
          <ScrollProgress />
          <SmoothScroll />
          <Nav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
