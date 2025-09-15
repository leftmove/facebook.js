import type { NextConfig } from "next";
import withMDX from "@next/mdx";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
};

export default withMDX({
  extension: /\.mdx?$/,
})(nextConfig);
