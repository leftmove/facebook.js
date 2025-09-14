import "./globals.css";
import Navigation from "components/navigation";
import Footer from "components/footer";
import Container from "components/container";

import { IBM_Plex_Sans } from "next/font/google";

export const metadata = {
  title: "facebook.js Docs",
  description: "Documentation for facebook.js",
};

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`bg-white text-gray-900 min-h-screen flex flex-col ${ibmPlexSans.className}`}
      >
        <Navigation />
        <Container>{children}</Container>
        <Footer />
      </body>
    </html>
  );
}
