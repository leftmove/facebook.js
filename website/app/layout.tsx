import { ThemeProvider } from "@/components/providers/ThemeProvider";
import Layout from "@/components/layout/Layout";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "../markdown.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Facebook.js",
    template: "%s | Facebook.js",
  },
  description: "A modern Facebook API wrapper for Node.js",
  viewport: "width=device-width, initial-scale=1",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Layout>{children}</Layout>
        </ThemeProvider>
      </body>
    </html>
  );
}
