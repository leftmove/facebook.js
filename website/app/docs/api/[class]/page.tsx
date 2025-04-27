import {
  getClassJSDocFromGithub,
  type ParsedJSDoc,
  type ParsedMethod,
} from "@/lib/jsdocGithub";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CollapsibleCode from "../CollapsibleCode";
import {
  FileText,
  Key,
  List,
  CornerDownLeft,
  Link as LucideLink,
  Layers,
  Lightbulb,
} from "lucide-react";

function UnifiedTable({
  items,
}: {
  items: { kind: string; name: string; type: string; description: string }[];
}) {
  if (!items || items.length === 0) return null;
  return (
    <div className="my-4 w-full overflow-x-auto">
      <table className="w-full text-sm rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800">
            <th className="px-4 py-2 text-left font-semibold text-blue-700 dark:text-blue-200">
              Kind
            </th>
            <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">
              Name
            </th>
            <th className="px-4 py-2 text-left font-semibold text-purple-700 dark:text-purple-200">
              Type
            </th>
            <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr
              key={item.kind + item.name + i}
              className={
                i % 2 === 0
                  ? "bg-white dark:bg-gray-900"
                  : "bg-gray-50 dark:bg-gray-800"
              }
            >
              <td className="px-4 py-2 font-mono text-blue-700 dark:text-blue-200 whitespace-nowrap flex items-center gap-1">
                {item.kind === "property" && (
                  <Key
                    size={14}
                    className="inline-block mr-1 text-blue-400 dark:text-blue-300"
                  />
                )}
                {item.kind === "param" && (
                  <List
                    size={14}
                    className="inline-block mr-1 text-purple-400 dark:text-purple-300"
                  />
                )}
                <span>
                  {item.kind.charAt(0).toUpperCase() + item.kind.slice(1)}
                </span>
              </td>
              <td className="px-4 py-2 font-mono text-blue-800 dark:text-blue-200 whitespace-nowrap">
                {item.name}
              </td>
              <td className="px-4 py-2 font-mono text-purple-800 dark:text-purple-200 whitespace-nowrap">
                {item.type}
              </td>
              <td className="px-4 py-2 text-gray-800 dark:text-gray-200">
                {item.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReturnsBlock({
  returns,
  returnsDescription,
}: {
  returns?: string;
  returnsDescription?: string;
}) {
  if (!returns) return null;
  return (
    <div className="my-4 flex items-center gap-2">
      <CornerDownLeft
        size={16}
        className="text-orange-400 dark:text-orange-300"
      />
      <span className="font-mono text-orange-900 dark:text-orange-100 bg-orange-50 dark:bg-orange-900 px-2 py-1 rounded mr-2">
        {returns}
      </span>
      <span className="text-gray-800 dark:text-gray-200">
        {returnsDescription}
      </span>
    </div>
  );
}

function ExtrasBox({ jsdoc }: { jsdoc: string | undefined }) {
  if (!jsdoc) return null;
  const lines = jsdoc
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .filter(
      (line) =>
        line.startsWith("@see") ||
        line.startsWith("@example") ||
        line.startsWith("@extends")
    );
  if (lines.length === 0) return null;
  return (
    <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 flex flex-wrap gap-3">
      {lines.map((line, idx) => {
        if (line.startsWith("@see")) {
          return (
            <span
              key={idx}
              className="inline-flex items-center gap-1 text-green-800 dark:text-green-200 text-xs font-mono bg-green-50 dark:bg-green-900 px-2 py-1 rounded"
            >
              <LucideLink
                size={14}
                className="text-green-400 dark:text-green-300"
              />{" "}
              {line}
            </span>
          );
        }
        if (line.startsWith("@extends")) {
          return (
            <span
              key={idx}
              className="inline-flex items-center gap-1 text-pink-800 dark:text-pink-200 text-xs font-mono bg-pink-50 dark:bg-pink-900 px-2 py-1 rounded"
            >
              <Layers size={14} className="text-pink-400 dark:text-pink-300" />{" "}
              {line}
            </span>
          );
        }
        if (line.startsWith("@example")) {
          return (
            <span
              key={idx}
              className="inline-flex items-center gap-1 text-yellow-800 dark:text-yellow-200 text-xs font-mono bg-yellow-50 dark:bg-yellow-900 px-2 py-1 rounded"
            >
              <Lightbulb
                size={14}
                className="text-yellow-400 dark:text-yellow-300"
              />{" "}
              {line}
            </span>
          );
        }
        return null;
      })}
    </div>
  );
}

function extractProperties(
  jsdoc: string | undefined
): { kind: string; name: string; type: string; description: string }[] {
  if (!jsdoc) return [];
  return jsdoc
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((line) => line.startsWith("@property"))
    .map((line) => {
      // @property {type} name - description
      const match = line.match(
        /@property\s+{([^}]+)}\s+(\[?\w+\]?)(?:\s+-\s+)?(.+)?/
      );
      return match
        ? {
            kind: "property",
            type: match[1],
            name: match[2].replace(/[\[\]]/g, ""),
            description: match[3] || "",
          }
        : { kind: "property", name: "", type: "", description: line };
    });
}

function extractParams(
  parsedJSDoc: ParsedJSDoc | undefined
): { kind: string; name: string; type: string; description: string }[] {
  if (!parsedJSDoc?.params) return [];
  return parsedJSDoc.params.map((p) => ({ kind: "param", ...p }));
}

function MethodCard({ method }: { method: ParsedMethod }) {
  // Only use the method's own JSDoc, never fallback to class-level doc
  const methodJSDoc = method.parsedJSDoc;
  const methodProperties = extractProperties(method.jsdoc);
  const params = extractParams(methodJSDoc);
  const unifiedItems = [...methodProperties, ...params];
  const hasTable = unifiedItems.length > 0;
  const hasExtras =
    !!method.jsdoc && /@(see|example|extends)/.test(method.jsdoc);
  const hasDescription =
    !!methodJSDoc?.description && methodJSDoc.description.trim().length > 0;

  // Only show @example as a code block if present
  let exampleBlock = null;
  if (methodJSDoc?.example) {
    exampleBlock = (
      <div className="my-2">
        <div className="text-xs text-gray-500 mb-1">Example</div>
        <CollapsibleCode code={methodJSDoc.example} />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-8 flex flex-col gap-4 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
        <span className="flex items-center gap-2 text-xl font-bold text-blue-900 dark:text-blue-200">
          <List size={20} className="text-blue-400 dark:text-blue-300" />
          {method.name}
        </span>
        <div className="flex-1 min-w-[200px] mt-2 sm:mt-0 sm:ml-4">
          <CollapsibleCode code={method.signature} />
        </div>
      </div>
      {hasDescription ? (
        <div className="prose dark:prose-invert text-base">
          {methodJSDoc!.description.split(/\n+/).map((p: string, i: number) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      ) : (
        <div className="text-gray-400 italic text-base">No description.</div>
      )}
      {exampleBlock}
      {hasTable && <UnifiedTable items={unifiedItems} />}
      <ReturnsBlock
        returns={methodJSDoc?.returns}
        returnsDescription={methodJSDoc?.returnsDescription}
      />
      {hasExtras && <ExtrasBox jsdoc={method.jsdoc} />}
    </div>
  );
}

function getJSDocSummary(jsdoc: string | undefined): string {
  if (!jsdoc) return "";
  const lines = jsdoc.split(/\r?\n/);
  const summaryLines = [];
  for (const line of lines) {
    if (line.trim().startsWith("@")) break;
    summaryLines.push(line);
  }
  const summary = summaryLines.join(" ").replace(/\s+/g, " ").trim();

  return summary;
}

export async function generateMetadata({
  params,
}: {
  params: { class: string };
}): Promise<Metadata> {
  const classDoc = await getClassJSDocFromGithub(
    params.class.charAt(0).toUpperCase() + params.class.slice(1)
  );
  return {
    title: classDoc ? `${classDoc.name} | API Reference` : "API Reference",
    description: classDoc?.description,
  };
}

export default async function ApiClassPage({
  params,
}: {
  params: { class: string };
}) {
  const className =
    params.class.charAt(0).toUpperCase() + params.class.slice(1);
  const classDoc = await getClassJSDocFromGithub(className);
  let modelClassDoc = null;
  if (className !== "Post") {
    modelClassDoc = await getClassJSDocFromGithub("Post");
  }

  if (!classDoc) return notFound();

  const classProperties: {
    kind: string;
    name: string;
    type: string;
    description: string;
  }[] = extractProperties(classDoc.description);
  let modelProperties: {
    kind: string;
    name: string;
    type: string;
    description: string;
  }[] = [];
  if (modelClassDoc) {
    modelProperties = extractProperties(modelClassDoc.description);
  }

  return (
    <div className="mx-auto max-w-3xl py-10 px-2 sm:px-0">
      {/* Render the model class (e.g. Post) as its own card at the top if it exists */}
      {modelClassDoc && (
        <div className="mb-10 bg-white dark:bg-gray-900 rounded-2xl shadow-md p-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText size={24} className="text-blue-400 dark:text-blue-300" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              {modelClassDoc.name}
            </h2>
          </div>
          {getJSDocSummary(modelClassDoc.description) && (
            <div className="prose dark:prose-invert text-base mb-4">
              {getJSDocSummary(modelClassDoc.description)
                .split(/\n+/)
                .map((p: string, i: number) => (
                  <p key={i}>{p}</p>
                ))}
            </div>
          )}
          {modelProperties.length > 0 && (
            <UnifiedTable items={modelProperties} />
          )}
        </div>
      )}
      {/* Main API class */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <FileText size={28} className="text-blue-400 dark:text-blue-300" />
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {classDoc.name}
          </h1>
        </div>
        {getJSDocSummary(classDoc.description) && (
          <div className="prose dark:prose-invert text-lg mb-4">
            {getJSDocSummary(classDoc.description)
              .split(/\n+/)
              .map((p: string, i: number) => (
                <p key={i}>{p}</p>
              ))}
          </div>
        )}
        {classProperties.length > 0 && <UnifiedTable items={classProperties} />}
      </div>
      <div className="flex flex-col gap-8">
        {classDoc.methods.map((method, idx) => (
          <MethodCard
            key={method.name + method.signature + idx}
            method={method}
          />
        ))}
      </div>
    </div>
  );
}
