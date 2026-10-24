import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata, type Viewport } from "next";

import { Providers } from "~/app/_components/providers";

const SITE_URL = "https://holdr.lol";
const TITLE = "Holdr · diamond hands portfolio";
const DESCRIPTION =
  "A simple self-hosted portfolio tracker: holdings, transactions, and live market prices.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Holdr",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/logo.webp", width: 512, height: 512, alt: "Holdr logo" }],
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/logo.webp"],
  },
  icons: [
    { rel: "icon", url: "/favicon.png", type: "image/png" },
    { rel: "apple-touch-icon", url: "/apple-touch-icon.png" },
  ],
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Holdr",
  url: SITE_URL,
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description: DESCRIPTION,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <body className="bg-white dark:bg-zinc-950">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
