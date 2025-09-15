import Link from "next/link";
import fs from "fs";
import path from "path";
import { compileMDX } from "next-mdx-remote/rsc";

import Code from "components/codeblock";
import Tip from "components/note";
import Command from "components/commandline";
import Documentation from "components/documentation";
import Hero from "components/hero";
import Description from "components/description";

const components = {
  Code,
  Tip,
  Command,
  Documentation,
  Hero,
  Link,
  Description,
};

export default async function Home() {
  const filePath = path.join(process.cwd(), "content/index.mdx");
  const source = fs.readFileSync(filePath, "utf8");

  const { content } = await compileMDX({
    source,
    components,
    options: { parseFrontmatter: true },
  });

  return (
    <div
      className="docs-content text-gray-900 dark:text-gray-100"
      data-pagefind-body
    >
      {content}
    </div>
  );
}
