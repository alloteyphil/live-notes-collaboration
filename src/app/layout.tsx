import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Live Notes",
  description: "Realtime notes with Better Auth and Convex",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="app-shell">
        <Providers>
          <header className="app-header">
            <div className="app-container flex h-14 items-center justify-between">
              <Link className="text-sm font-semibold tracking-tight" href="/">
                Live Notes
              </Link>
              <nav className="flex items-center gap-5 text-sm">
                <Link className="app-muted transition hover:text-zinc-900" href="/">
                  Home
                </Link>
                <Link className="app-muted transition hover:text-zinc-900" href="/dashboard">
                  Dashboard
                </Link>
              </nav>
            </div>
          </header>
          <div className="app-main">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
