import type { Metadata } from "next";
import { Work_Sans } from "next/font/google";
import { AuthProvider } from "./context/AuthContext";
import LayoutWrapper from "./components/LayoutWrapper";
import "./globals.css";

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
});

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://codeplayer.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Code Player - Online HTML, CSS & JavaScript Editor",
    template: "%s | Code Player",
  },
  description:
    "Create, edit, and preview HTML, CSS, and JavaScript code in real-time. Share your code snippets with a simple link. Perfect for developers, designers, and learners.",
  keywords: [
    "code editor",
    "html editor",
    "css editor",
    "javascript editor",
    "online code editor",
    "code playground",
    "html css js editor",
    "live code editor",
    "code snippet",
    "share code",
  ],
  authors: [{ name: "Code Player" }],
  creator: "Code Player",
  publisher: "Code Player",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Code Player",
    title: "Code Player - Online HTML, CSS & JavaScript Editor",
    description:
      "Create, edit, and preview HTML, CSS, and JavaScript code in real-time. Share your code snippets with a simple link.",
    images: [
      {
        url: `${siteUrl}/logo.png`,
        width: 1200,
        height: 630,
        alt: "Code Player Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Code Player - Online HTML, CSS & JavaScript Editor",
    description:
      "Create, edit, and preview HTML, CSS, and JavaScript code in real-time. Share your code snippets with a simple link.",
    images: [`${siteUrl}/logo.png`],
    creator: "@codeplayer",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "ZdTxiXrK0yjpYGk5ggg9hsAuDwAsffJ4NVTFA-3CMys",
    // yandex: "your-yandex-verification-code",
    // bing: "your-bing-verification-code",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://codeplayer.app";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Code Player",
    description:
      "Create, edit, and preview HTML, CSS, and JavaScript code in real-time. Share your code snippets with a simple link.",
    url: siteUrl,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "HTML Editor",
      "CSS Editor",
      "JavaScript Editor",
      "Live Preview",
      "Console Output",
      "Code Sharing",
      "Email Integration",
    ],
  };

  return (
    <html lang="en" className={workSans.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
      <body className={workSans.className}>
        <AuthProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
