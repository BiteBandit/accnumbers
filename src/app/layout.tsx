import "./globals.css";
import MaintenanceBanner from "@/components/MaintenanceBanner";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import CommunityModal from "@/components/CommunityModal";
import seoBanner from "./seo-banner.png";

export const metadata = {
  metadataBase: new URL('https://accnumbers.com'),
  title: {
    default: "Accnumbers - Instant Virtual SMS & OTP Verification Numbers",
    template: "%s | Accnumbers"
  },
  description: "Rent reliable non-VoIP temporary phone numbers online for WhatsApp, Telegram, Google, Netflix, and 1000+ services. Instant SMS and OTP code delivery.",
  keywords: [
    "virtual SMS verification",
    "temporary phone number for OTP",
    "non-VoIP numbers for WhatsApp",
    "rent virtual number online",
    "Telegram verification number",
    "receive SMS online",
    "disposable phone numbers",
    "SMS activate alternative",
    "acc numbers",
    "virtual number"
  ],
  authors: [{ name: "Accnumbers" }],
  creator: "Accnumbers",
  publisher: "Accnumbers",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: 'https://accnumbers.com',
  },
  openGraph: {
    title: "Accnumbers - Instant Virtual SMS & OTP Verification Numbers",
    description: "Rent reliable non-VoIP temporary phone numbers online for WhatsApp, Telegram, Google, and 1000+ services.",
    url: 'https://accnumbers.com',
    siteName: 'Accnumbers',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: seoBanner.src,
        width: 1200,
        height: 630,
        alt: 'Accnumbers - Instant Virtual SMS & OTP Verification',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Accnumbers - Instant Virtual SMS & OTP Verification Numbers",
    description: "Rent reliable non-VoIP temporary phone numbers online for WhatsApp, Telegram, Google, and 1000+ services.",
    images: [seoBanner.src],
    creator: '@accnumbers',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-search-console-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Accnumbers',
    url: 'https://accnumbers.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://accnumbers.com/dashboard/numbers?service={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang="en">
      <head>
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" 
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" 
          crossOrigin="anonymous" 
          referrerPolicy="no-referrer" 
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-slate-950 text-slate-100 antialiased font-sans">
        <MaintenanceBanner />
        <AnnouncementBanner />
        <CommunityModal />
        {children}
      </body>
    </html>
  );
}

