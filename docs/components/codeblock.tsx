import React from "react";

export default async function Code({
  language,
  children,
}: {
  language: string;
  children: string;
}) {
  // Use client-side rendering with a simple pre/code fallback initially
  return (
    <div
      className="my-6 rounded-lg overflow-x-auto bg-gray-50 border border-gray-200 shadow-sm"
      data-pagefind-ignore
    >
      <div className="px-4 py-2 bg-gray-100 border-b border-gray-200 text-xs font-medium text-gray-500">
        {language}
      </div>
      <div className="p-4">
        <pre className={`language-${language}`}>
          <code className="bg-transparent">{children}</code>
        </pre>
      </div>
    </div>
  );
}
