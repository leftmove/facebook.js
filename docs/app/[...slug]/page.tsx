import fs from "fs";
import path from "path";
import React, { ReactNode } from "react";

import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import { Metadata } from "next";
import Image from "next/image";
import { slug as slugify } from "github-slugger";

import Code from "components/codeblock";
import Note from "@/components/note";
import Command from "components/commandline";
import Link from "components/link";

interface Frontmatter {
  title?: string;
  description?: string;
  [key: string]: string | undefined;
}

// Create heading components with automatic ID generation
const createHeadingWithId = (level: number) => {
  const Component = ({ children }: { children: ReactNode }) => {
    // Skip ID generation for elements that aren't strings
    if (typeof children !== "string") {
      return React.createElement(`h${level}`, {}, children);
    }

    // Generate ID from the heading text
    const id = slugify(children);

    return React.createElement(
      `h${level}`,
      { id, className: "scroll-mt-20" },
      children
    );
  };

  return Component;
};

const components = {
  Code,
  Note,
  Command,
  Link,
  Image,
  h1: createHeadingWithId(1),
  h2: createHeadingWithId(2),
  h3: createHeadingWithId(3),
  h4: createHeadingWithId(4),
  h5: createHeadingWithId(5),
  h6: createHeadingWithId(6),
};

// Add generateStaticParams to pre-render all pages at build time
export async function generateStaticParams() {
  // Get all content files
  const contentDir = path.join(process.cwd(), "content");

  function getContentPaths(dir: string, basePath: string = ""): string[][] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    return entries.flatMap((entry) => {
      const entryPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Check if directory has an index.mdx
        if (fs.existsSync(path.join(entryPath, "index.mdx"))) {
          const relativePath = path.join(basePath, entry.name);
          return [[...relativePath.split(path.sep)]];
        }
        return getContentPaths(entryPath, path.join(basePath, entry.name));
      } else if (entry.name.endsWith(".mdx") && entry.name !== "index.mdx") {
        // For non-index MDX files
        const fileName = entry.name.replace(/\.mdx$/, "");
        return [[...path.join(basePath, fileName).split(path.sep)]];
      }
      return [];
    });
  }

  return getContentPaths(contentDir).map((slug) => ({ slug }));
}

// Generate metadata for each page
export async function generateMetadata(props: SlugProps): Promise<Metadata> {
  const params = await props.params;
  const source = await getMarkdownContent(params.slug);
  if (!source) return { title: "Not Found" };

  // Extract frontmatter
  try {
    // Use any for the result to avoid type issues with the MDX compiler
    const result = (await compileMDX({
      source,
      options: { parseFrontmatter: true },
    })) as { frontmatter: Frontmatter };

    return {
      title: result.frontmatter.title || params.slug.join(" / "),
      description: result.frontmatter.description || "Documentation page",
    };
  } catch (error) {
    console.error("Error parsing MDX frontmatter:", error);
    return { title: params.slug.join(" / ") };
  }
}

async function getMarkdownContent(slug: string[]) {
  // Handle root route
  if (slug.length === 0) {
    const filePath = path.join(process.cwd(), "content", "index.mdx");
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return fs.readFileSync(filePath, "utf8");
  }

  // Check for index.mdx in subdirectory
  const dirPath = path.join(process.cwd(), "content", ...slug);
  const filePath = path.join(dirPath, "index.mdx");

  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, "utf8");
  }

  // If not found, check for direct .mdx file
  const directFilePath = `${path.join(process.cwd(), "content", ...slug)}.mdx`;
  if (fs.existsSync(directFilePath)) {
    return fs.readFileSync(directFilePath, "utf8");
  }

  return null;
}

interface SlugProps {
  params: Promise<{ slug: string[] }>;
}

export default async function Page(props: SlugProps) {
  const params = await props.params;
  const source = await getMarkdownContent(params.slug || []);

  if (!source) {
    notFound();
  }

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
