import { Layout, Navbar } from "nextra-theme-docs";
import { Banner, Head } from "nextra/components";
import { getPageMap } from "nextra/page-map";

import "app/globals.css";
import "nextra-theme-docs/style.css";

export const metadata = {
  // Define your metadata here
  // For more information on metadata API, see: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
};

const banner = (
  <Banner storageKey="active-development">
    This library is in active development — expect breaking changes.
  </Banner>
);
const navbar = <Navbar logo={<b>facebook.js</b>} />;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head></Head>
      <body>
        <Layout
          banner={banner}
          navbar={navbar}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/shuding/nextra/tree/main/docs"
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
