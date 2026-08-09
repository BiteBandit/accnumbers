import "./globals.css";
import MaintenanceBanner from "@/components/MaintenanceBanner";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import CommunityModal from "@/components/CommunityModal";

export const metadata = {
  title: "Accnumbers - Instant Virtual SMS & OTP Verification",
  description: "Rent non-VoIP temporary numbers worldwide for WhatsApp, Telegram, Google, and 50+ services.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

