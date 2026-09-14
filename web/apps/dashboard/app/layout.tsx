import type { Metadata, Viewport } from "next";
import { Providers } from "@repo/ui/providers";
import { ACCENT_BOOT_SCRIPT } from "@repo/ui/theme-boot";
import { AuthProvider } from "../lib/auth-context";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "TrueLabel Dashboard", template: "%s · TrueLabel Dashboard" },
  description: "Crash reports, complaints, and data operations for TrueLabel.",
  robots: { index: false, follow: false },
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
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('theme')==='light'){document.documentElement.classList.remove('dark')}}catch(e){}" + ACCENT_BOOT_SCRIPT,
          }}
        />
      </head>
      <body className="bg-bg text-fg antialiased">
        <Providers>
          <AuthProvider>{children}</AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
