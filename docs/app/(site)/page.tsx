import Link from "next/link";
import fs from "fs";
import path from "path";
import { compileMDX } from "next-mdx-remote/rsc";

import Code from "components/codeblock";
import Tip from "components/tip";
import Command from "components/commandline";
import Hero from "components/hero";

const components = {
  Code,
  Tip,
  Command,
  Hero,
  Link,
};

export default async function Home() {
  // Read the content directly from the file
  const filePath = path.join(process.cwd(), "content/index.mdx");
  const source = fs.readFileSync(filePath, "utf8");

  const { content } = await compileMDX({
    source,
    components,
    options: { parseFrontmatter: true },
  });

  return (
    <div className="docs-content" data-pagefind-body>
      {content}
    </div>
  );
}
