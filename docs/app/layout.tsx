import "./globals.css";
import Navigation from "components/navigation";
import Footer from "components/footer";
import Container from "components/container";

export const metadata = {
  title: "facebook.js Docs",
  description: "Documentation for facebook.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 min-h-screen flex flex-col">
        <Navigation />
        <Container>{children}</Container>
        <Footer />
      </body>
    </html>
  );
}
