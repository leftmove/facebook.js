import { cache } from "react";

const REPO_OWNER = "leftmove";
const REPO_NAME = "facebook.js";
const BRANCH = "main";
const SRC_PATH = "src/client";

export type ParsedParam = {
  name: string;
  type: string;
  description: string;
};

export type ParsedJSDoc = {
  description: string;
  params: ParsedParam[];
  returns?: string;
  returnsDescription?: string;
  example?: string;
};

export type ParsedMethod = {
  name: string;
  signature: string;
  jsdoc: string;
  parsedJSDoc?: ParsedJSDoc;
};

export type ParsedClass = {
  name: string;
  description: string;
  methods: ParsedMethod[];
};

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseJSDocBlock(jsdoc: string): ParsedJSDoc {
  const lines = jsdoc.split(/\r?\n/).map((l) => l.trim().replace(/^\* ?/, ""));
  let description = "";
  const params: ParsedParam[] = [];
  let returns: string | undefined;
  let returnsDescription: string | undefined;
  let example: string | undefined;
  let inDescription = true;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("@param")) {
      inDescription = false;
      const match = line.match(
        /@param\s+{([^}]+)}\s+(\[?\w+\]?)(?:\s+-\s+)?(.+)?/
      );
      if (match) {
        params.push({
          type: match[1],
          name: match[2].replace(/[\[\]]/g, ""),
          description: match[3] || "",
        });
      }
    } else if (line.startsWith("@returns") || line.startsWith("@return")) {
      inDescription = false;
      const match = line.match(/@returns?\s+{([^}]+)}(?:\s+-\s+)?(.+)?/);
      if (match) {
        returns = match[1];
        returnsDescription = match[2] || "";
      }
    } else if (line.startsWith("@example")) {
      inDescription = false;
      example = lines.slice(i + 1).join("\n");
      break;
    } else if (inDescription) {
      description += (description ? "\n" : "") + line;
    }
  }
  return {
    description: description.trim(),
    params,
    returns,
    returnsDescription,
    example,
  };
}

function parseJSDocAndMethods(
  source: string,
  className: string
): ParsedClass | null {
  // Escape className for regex
  const safeClassName = escapeRegExp(className);
  // Find the JSDoc block immediately before the class declaration
  const classJSDocMatch = source.match(
    new RegExp("\\/\\*\\*([\\s\\S]*?)\\*\\/\\s*export class " + safeClassName)
  );
  const classDescription = classJSDocMatch
    ? classJSDocMatch[1].replace(/\s*\* ?/g, "\n").trim()
    : "";

  // Find all methods with JSDoc
  const methodRegex =
    /\/\*\*([\s\S]*?)\*\/\s+(public |private |protected )?(async )?(\w+)\s*\(([^)]*)\)\s*(:\s*[^\s{]+)?/g;
  const methods: ParsedMethod[] = [];
  let match;
  while ((match = methodRegex.exec(source))) {
    const jsdoc = match[1].replace(/\s*\* ?/g, "\n").trim();
    const name = match[4];
    const params = match[5];
    const returnType = match[6] ? match[6].replace(/[:\s]/g, "") : "";
    const signature = `${name}(${params})${returnType ? `: ${returnType}` : ""}`;
    const parsedJSDoc = parseJSDocBlock(jsdoc);
    methods.push({ name, signature, jsdoc, parsedJSDoc });
  }
  if (!classDescription && methods.length === 0) return null;
  return {
    name: className,
    description: classDescription,
    methods,
  };
}

export const getClassJSDocFromGithub = cache(
  async (className: string): Promise<ParsedClass | null> => {
    const fileName = `${SRC_PATH}/${className.toLowerCase()}.ts`;
    const url = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${fileName}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const source = await res.text();
    return parseJSDocAndMethods(source, className);
  }
);
