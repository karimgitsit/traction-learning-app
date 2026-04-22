import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Traction — Learn",
  description:
    "A personal learning app for mastering Traction by Weinberg & Mares.",
  applicationName: "Traction Learning",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Traction",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

function TopNav() {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur sticky top-0 z-10">
      <nav className="max-w-5xl mx-auto px-4 md:px-6 h-12 flex items-center justify-between">
        <Link
          href="/"
          className="text-[13px] font-semibold tracking-tight hover:text-[var(--accent)]"
        >
          Traction
        </Link>
        <div className="flex items-center gap-4 sm:gap-5 text-[13px] text-[var(--muted)]">
          <Link href="/study" className="hover:text-[var(--foreground)]">
            Study
          </Link>
          <Link href="/library" className="hover:text-[var(--foreground)]">
            Library
          </Link>
          <Link href="/journal" className="hover:text-[var(--foreground)]">
            Journal
          </Link>
          <Link
            href="/settings"
            className="hover:text-[var(--foreground)] text-[12px] opacity-70 hover:opacity-100"
            aria-label="Settings"
          >
            ⚙
          </Link>
        </div>
      </nav>
    </header>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <TopNav />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
