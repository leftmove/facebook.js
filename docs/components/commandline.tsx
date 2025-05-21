"use client";

import { useState, useRef } from "react";
import clsx from "clsx";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import bash from "react-syntax-highlighter/dist/cjs/languages/prism/bash";
import javascript from "react-syntax-highlighter/dist/cjs/languages/prism/javascript";
import { prism } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { usePreferences, type PackageManager } from "./preferences";

// Register languages
SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("javascript", javascript);

// Base props shared across all variants
interface BaseCommandLineProps {
  className?: string;
  language?: string; // Language for syntax highlighting
}

// Props specific to default variant
interface DefaultCommandLineProps extends BaseCommandLineProps {
  variant: "default";
  command: string;
  packageName?: never; // Not used in default variant
}

// Props specific to install variant
interface InstallCommandLineProps extends BaseCommandLineProps {
  variant: "install";
  packageName: string;
  command?: never; // Not used in install variant
}

// Props specific to execute variant (npx, bunx, etc.)
interface ExecuteCommandLineProps extends BaseCommandLineProps {
  variant: "execute";
  packageName: string;
  command?: never; // Not used in execute variant
}

// Union type of all variants
type CommandLineProps =
  | (BaseCommandLineProps & { variant?: undefined; command: string }) // Default implicit
  | DefaultCommandLineProps
  | InstallCommandLineProps
  | ExecuteCommandLineProps;

// Copy button component
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      (err) => {
        console.error("Could not copy text: ", err);
      }
    );
  };

  return (
    <div className="flex items-center relative">
      <span
        className={clsx(
          "mr-1 text-xs font-medium text-cobalt-500 whitespace-nowrap",
          copied
            ? "opacity-100 translate-x-0"
            : "opacity-0 -translate-x-2 pointer-events-none",
          "transition-all duration-200 absolute right-full"
        )}
      >
        Copied
      </span>
      <button
        onClick={copyToClipboard}
        className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
        aria-label="Copy to clipboard"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>
    </div>
  );
}

// Syntax highlighter wrapper
function CodeBlock({
  code,
  language = "bash",
}: {
  code: string;
  language?: string;
}) {
  const codeRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={codeRef} className="text-sm overflow-x-auto flex-1">
      <SyntaxHighlighter
        language={language}
        style={prism}
        customStyle={{
          backgroundColor: "transparent",
          padding: "0.5rem 0",
          margin: 0,
          fontSize: "0.875rem",
          fontFamily: "Menlo, Monaco, Consolas, 'Courier New', monospace",
        }}
        codeTagProps={{
          style: {
            fontSize: "0.875rem",
            fontFamily: "Menlo, Monaco, Consolas, 'Courier New', monospace",
            backgroundColor: "transparent",
          },
        }}
        wrapLongLines={true}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

// Default command line variant
function DefaultCommandLine({
  command,
  language = "bash",
  className,
}: {
  command: string;
  language?: string;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-lg overflow-hidden mb-6 border border-gray-200 bg-white shadow-sm",
        className
      )}
    >
      <div className="p-4 flex justify-between items-center bg-white">
        <CodeBlock code={command} language={language} />
        <CopyButton text={command} />
      </div>
    </div>
  );
}

// Install variant with package manager and registry tabs
function InstallCommandLine({
  packageName,
  language = "bash",
  className,
}: {
  packageName: string;
  language?: string;
  className?: string;
}) {
  const {
    packageManager: activeManager,
    registry,
    setPackageManager: setActiveManager,
    setRegistry,
    isHydrated,
  } = usePreferences();

  const getInstallCommand = (manager: PackageManager): string => {
    const prefix = registry === "jsr" ? "jsr:" : "";
    const fullPackage = `${prefix}${packageName}`;

    switch (manager) {
      case "npm":
        return `npm install ${fullPackage}`;
      case "yarn":
        return `yarn add ${fullPackage}`;
      case "pnpm":
        return `pnpm add ${fullPackage}`;
      case "bun":
        return `bun add ${fullPackage}`;
      default:
        return "";
    }
  };

  // Fall back to npm during SSR or before hydration
  const command = isHydrated
    ? getInstallCommand(activeManager)
    : `npm install ${packageName}`;

  return (
    <div
      className={clsx(
        "rounded-lg overflow-hidden mb-6 border border-gray-200 bg-white shadow-sm",
        className
      )}
    >
      {isHydrated && (
        <div className="flex justify-between">
          <div className="flex ml-2 border-b border-gray-200">
            {(["npm", "yarn", "pnpm", "bun"] as const).map((manager) => (
              <button
                key={manager}
                className={clsx(
                  "px-4 py-2 text-sm transition-all duration-50",
                  activeManager === manager
                    ? "text-gray-900 border-b-2 border-cobalt-500 font-medium"
                    : "text-gray-500 hover:border-b-2 hover:border-cobalt-500 hover:text-gray-700"
                )}
                onClick={() => setActiveManager(manager)}
              >
                {manager}
              </button>
            ))}
          </div>
          <div className="mr-2 flex items-center border-b border-gray-200">
            <button
              className={clsx(
                "px-4 py-2 text-sm transition-all duration-50",
                registry === "npm"
                  ? "text-gray-900 border-b-2 border-cobalt-500 font-medium"
                  : "text-gray-500 hover:text-gray-700"
              )}
              onClick={() => setRegistry("npm")}
            >
              npm
            </button>
            <button
              className={clsx(
                "px-4 py-2 text-sm transition-all duration-50",
                registry === "jsr"
                  ? "text-gray-900 border-b-2 border-cobalt-500 font-medium"
                  : "text-gray-500 hover:text-gray-700"
              )}
              onClick={() => setRegistry("jsr")}
            >
              jsr
            </button>
          </div>
        </div>
      )}
      <div className="p-4 flex justify-between items-center bg-white">
        <CodeBlock code={command} language={language} />
        <CopyButton text={command} />
      </div>
    </div>
  );
}

// Execute variant with package manager tabs (no registry)
function ExecuteCommandLine({
  packageName,
  language = "bash",
  className,
}: {
  packageName: string;
  language?: string;
  className?: string;
}) {
  const {
    packageManager: activeManager,
    setPackageManager: setActiveManager,
    isHydrated,
  } = usePreferences();

  const getExecuteCommand = (manager: PackageManager): string => {
    switch (manager) {
      case "npm":
        return `npx ${packageName}`;
      case "yarn":
        return `yarn dlx ${packageName}`;
      case "pnpm":
        return `pnpm dlx ${packageName}`;
      case "bun":
        return `bunx ${packageName}`;
      default:
        return "";
    }
  };

  // Fall back to npx during SSR or before hydration
  const command = isHydrated
    ? getExecuteCommand(activeManager)
    : `npx ${packageName}`;

  return (
    <div
      className={clsx(
        "rounded-lg overflow-hidden mb-6 border border-gray-200 bg-white shadow-sm",
        className
      )}
    >
      {isHydrated && (
        <div className="flex">
          <div className="flex ml-2 border-b border-gray-200">
            {(["npm", "yarn", "pnpm", "bun"] as const).map((manager) => (
              <button
                key={manager}
                className={clsx(
                  "px-4 py-2 text-sm transition-all duration-50",
                  activeManager === manager
                    ? "text-gray-900 border-b-2 border-cobalt-500 font-medium"
                    : "text-gray-500 hover:border-b-2 hover:border-cobalt-500 hover:text-gray-700"
                )}
                onClick={() => setActiveManager(manager)}
              >
                {manager}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="p-4 flex justify-between items-center bg-white">
        <CodeBlock code={command} language={language} />
        <CopyButton text={command} />
      </div>
    </div>
  );
}

// Main component that determines which variant to render
export default function CommandLine(props: CommandLineProps) {
  // Choose the appropriate variant based on props
  if (props.variant === "install") {
    return (
      <InstallCommandLine
        packageName={props.packageName}
        language={props.language}
        className={props.className}
      />
    );
  }

  if (props.variant === "execute") {
    return (
      <ExecuteCommandLine
        packageName={props.packageName}
        language={props.language}
        className={props.className}
      />
    );
  }

  // Default variant (either explicit or implicit)
  const command = "command" in props ? props.command : "";
  return (
    <DefaultCommandLine
      command={command}
      language={props.language}
      className={props.className}
    />
  );
}

// Example usage:
// Default variant (implicit):
// <CommandLine command="echo 'Hello World'" />
//
// Default variant (explicit):
// <CommandLine variant="default" command="echo 'Hello World'" />
//
// With specific language:
// <CommandLine command="const x = 5;" language="javascript" />
//
// Install variant (requires packageName):
// <CommandLine variant="install" packageName="react" />
//
// Install variant with specific language:
// <CommandLine variant="install" packageName="react" language="shell" />
//
// Execute variant (npx, bunx, etc.):
// <CommandLine variant="execute" packageName="create-next-app" />
