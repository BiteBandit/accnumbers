import "./globals.css";
import MaintenanceBanner from "@/components/MaintenanceBanner";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import CommunityModal from "@/components/CommunityModal";

export const metadata = {
  title: "Accnumbers - Instant Virtual SMS & OTP Verification",
  description: "Rent non-VoIP temporary numbers worldwide for WhatsApp, Telegram, Google, and 150+ services.",
  metadataBase: new URL('https://accnumbers.com'),
  openGraph: {
    title: "Accnumbers - Instant Virtual SMS & OTP Verification",
    description: "Rent non-VoIP temporary numbers worldwide for WhatsApp, Telegram, Google, and 50+ services.",
    url: 'https://accnumbers.com',
    siteName: 'Accnumbers',
    type: 'website',
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
        {/* Font Awesome 6 Free CDN */}
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" 
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" 
          crossOrigin="anonymous" 
          referrerPolicy="no-referrer" 
        />
        {/* SEO Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-slate-950 text-slate-100 antialiased font-sans">
        {/* Global Maintenance Banner */}
        <MaintenanceBanner />

        {/* Global Announcement Banner */}
        <AnnouncementBanner />

        {/* Global Community/Group Links Popup */}
        <CommunityModal />
        
        {children}
      </body>
    </html>
  );
}

