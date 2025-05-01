import {
  Project,
  SyntaxKind,
  ClassDeclaration,
  FunctionDeclaration,
  TypeAliasDeclaration,
  InterfaceDeclaration,
  VariableDeclaration,
} from "ts-morph";

async function getGitHubCode(path: string) {
  console.log(
    `https://raw.githubusercontent.com/leftmove/facebook.js/main/src/${path}`
  );
  const response = await fetch(
    `https://raw.githubusercontent.com/leftmove/facebook.js/main/src/${path}`,
    {
      next: {
        revalidate: 24 * 60 * 60,
      },
    }
  );

  if (response.ok === false) {
    throw new Error("Failed to fetch code");
  }

  return response.text();
}

type Type = "class" | "function" | "type" | "variable" | "interface";

function getDeclarationKind(type: Type): SyntaxKind {
  switch (type) {
    case "class":
      return SyntaxKind.ClassDeclaration;
    case "function":
      return SyntaxKind.FunctionDeclaration;
    case "type":
      return SyntaxKind.TypeAliasDeclaration;
    case "interface":
      return SyntaxKind.InterfaceDeclaration;
    case "variable":
      return SyntaxKind.VariableDeclaration;
    default:
      throw new Error(`Unsupported type: ${type}`);
  }
}

type DeclarationType =
  | ClassDeclaration
  | FunctionDeclaration
  | TypeAliasDeclaration
  | InterfaceDeclaration
  | VariableDeclaration;

function extractDeclaration(code: string, name: string, type: Type): string {
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      jsDocParsingMode: 1,
    },
  });

  const sourceFile = project.createSourceFile("temp.ts", code);
  const kind = getDeclarationKind(type);

  const declarations = sourceFile.getDescendantsOfKind(
    kind
  ) as DeclarationType[];
  const declaration = declarations.find((d) => d.getName() === name);

  if (declaration === undefined) {
    throw new Error(`Could not find ${type} declaration: ${name}`);
  }

  const parsed = declaration.getText();

  const interfaces = sourceFile.getInterface("Config");
  if (interfaces) {
    const jsdoc = interfaces.getJsDocs();
    console.log(interfaces.getText(), jsdoc);
  } else {
    console.log("No interfaces found");
  }

  return parsed;
}

interface DocumentationProps {
  file: string;
  name: string;
  type: Type;
}

export default async function Documentation({
  file,
  name,
  type,
}: DocumentationProps) {
  let code: string;
  let declaration: string;
  try {
    code = await getGitHubCode(file);
    declaration = extractDeclaration(code, name, type);
  } catch (error) {
    console.error(error);
    return null;
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <pre className="p-4 bg-gray-800 text-gray-100 rounded overflow-x-auto">
        <code>{declaration}</code>
      </pre>
    </div>
  );
}
