import type { NextConfig } from "next";
import withMDX from "@next/mdx";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withMDX({
  extension: /\.mdx?$/,
})(nextConfig);
