import type { Metadata } from "next";
import localFont from "next/font/local";
import { RootProvider } from "fumadocs-ui/provider/next";
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
  title: {
    default: "TrueLabel Docs",
    template: "%s · TrueLabel Docs",
  },
  description: "Developer documentation for the TrueLabel monorepo — backend API, iOS app, web app, and deployment.",
  icons: {
    // Follows the OS theme, not the in-app toggle — a favicon can't react
    // to a class on <html>, only to prefers-color-scheme. The Apple touch
    // icon needs no such split: app/apple-icon.png is picked up on its own
    // by Next's file convention.
    icon: [
      { url: "/favicon-light.png", media: "(prefers-color-scheme: light)" },
      { url: "/favicon-dark.png", media: "(prefers-color-scheme: dark)" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <RootProvider theme={{ attribute: "class", defaultTheme: "dark" }}>{children}</RootProvider>
      </body>
    </html>
  );
}
