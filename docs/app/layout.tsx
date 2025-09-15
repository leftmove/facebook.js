import "./globals.css";
import Navigation from "components/navigation";
import Footer from "components/footer";
import Container from "components/container";
import { PreferencesProvider } from "components/preferences";

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
        className={`bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen flex flex-col ${ibmPlexSans.className}`}
      >
        <PreferencesProvider>
          <Navigation />
          <Container>{children}</Container>
          <Footer />
        </PreferencesProvider>
      </body>
    </html>
  );
}
