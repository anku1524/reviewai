import "./globals.css";

export const metadata = {
  title: "ReviewAI",
  description: "Turn customer feedback into better reviews, stronger reputation, and business growth.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0B0F19] text-[#f8fafc] font-sans antialiased">{children}</body>
    </html>
  );
}
