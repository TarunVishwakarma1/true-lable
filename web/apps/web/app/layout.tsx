import type { Metadata } from "next";
import localFont from "next/font/local";
import { Nav } from "./components/nav";
import { SmoothScroll } from "./components/smooth-scroll";
import { Cursor } from "./components/cursor";
import { Preloader } from "./components/preloader";
import { ScrollProgress } from "./components/scroll-progress";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "TrueLabel — Scan. Verify. Know.",
  description:
    "Open-source nutrition data for every product you buy. Community-verified, India-first, completely free.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-white text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-50`}
      >
        <Preloader />
        <div className="grain" />
        <Cursor />
        <ScrollProgress />
        <SmoothScroll />
        <Nav />
        {children}
      </body>
    </html>
  );
}
