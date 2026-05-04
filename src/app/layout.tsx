import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Hardflip AI — The Accountability Coach That Won't Let You Quit",
  description:
    "AI-powered accountability coaching. Set goals, get held accountable, and actually follow through. Hardflip AI won't let you off the hook.",
  keywords: ["accountability", "AI coach", "goal setting", "productivity"],
  openGraph: {
    title: "Hardflip AI",
    description: "The AI accountability coach that won't let you quit.",
    url: "https://hardflip.ai",
    siteName: "Hardflip AI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-text-primary font-sans antialiased min-h-screen">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
