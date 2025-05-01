import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import {
  Project,
  JSDocTag,
  ClassDeclaration,
  FunctionDeclaration,
  TypeAliasDeclaration,
  VariableDeclaration,
} from "ts-morph";

const sourceDirectory = path.join(process.cwd(), "../src/");

interface JSDocInfo {
  description: string;
  tags: Array<{
    name: string;
    text: string;
  }>;
}

async function extract(
  source: string,
  symbol: string,
  type: "class" | "function" | "type" | "variable"
): Promise<JSDocInfo | null> {
  const project = new Project({
    useInMemoryFileSystem: true,
  });

  const sourceFile = project.createSourceFile("temp.ts", source);

  let node:
    | ClassDeclaration
    | FunctionDeclaration
    | TypeAliasDeclaration
    | VariableDeclaration
    | undefined;
  switch (type) {
    case "class":
      node = sourceFile.getClass(symbol);
      break;
    case "function":
      node = sourceFile.getFunction(symbol);
      break;
    case "type":
      node = sourceFile.getTypeAlias(symbol);
      break;
    case "variable":
      node = sourceFile.getVariableDeclaration(symbol);
      break;
  }

  if (!node) {
    return null;
  }

  const jsDocs = (
    node as ClassDeclaration | FunctionDeclaration | TypeAliasDeclaration
  ).getJsDocs();
  if (jsDocs.length === 0) {
    return null;
  }

  const jsDoc = jsDocs[0];
  const description = jsDoc.getDescription();
  const tags = jsDoc.getTags().map((tag: JSDocTag) => ({
    name: tag.getTagName(),
    text: tag.getComment()?.toString() || "",
  }));

  return {
    description: description || "",
    tags,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get("file");
  const name = searchParams.get("name");
  const type = searchParams.get("type") as
    | "class"
    | "function"
    | "type"
    | "variable";

  if (!file || !name || !type) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  try {
    const sourceCode = fs.readFileSync(
      path.join(sourceDirectory, file),
      "utf-8"
    );
    const docInfo = await extract(sourceCode, name, type);

    console.log(docInfo);

    if (!docInfo) {
      return NextResponse.json(
        { error: "No documentation found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ docInfo, sourceCode });
  } catch (error) {
    console.error("Error loading documentation:", error);
    return NextResponse.json(
      { error: "Failed to load documentation" },
      { status: 500 }
    );
  }
}
