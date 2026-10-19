import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "./globals.css";
import { Mark } from "@/components/Mark";
import { SITE_URL, X_URL } from "@/lib/social";

const description = "Paste any Robinhood Chain contract, even unverified ones. Dissect cuts the bytecode open and tells you, in plain English, what the dev can do to you.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Dissect · Cut it open. See what's inside.",
  description,
  openGraph: { title: "Dissect", description, siteName: "Dissect" },
  twitter: { card: "summary_large_image", title: "Dissect", description },
};

export const viewport: Viewport = { themeColor: "#070707", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <div className="backdrop" aria-hidden>
          <div className="scan" />
          <div className="glow" />
        </div>
        <header className="top">
          <a href="/" className="brand">
            <Mark />
            <span>DISSECT</span>
          </a>
          <nav>
            {X_URL && (
              <a href={X_URL} target="_blank" rel="noreferrer">
                X
              </a>
            )}
            <span className="pill">Robinhood Chain</span>
          </nav>
        </header>
        {children}
        <footer className="foot">
          <span>Dissect · Cut it open. See what’s inside.</span>
          <span>Reads public bytecode only. Never asks for your wallet.</span>
        </footer>
      </body>
    </html>
  );
}
