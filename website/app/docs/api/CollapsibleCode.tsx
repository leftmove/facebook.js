"use client";
import { useState } from "react";

export default function CollapsibleCode({
  code,
  className = "",
}: {
  code: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const lines = code.split("\n");
  const isLong = lines.length > 8;
  return (
    <div className={className}>
      <pre className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3 text-xs font-mono overflow-x-auto max-h-96 relative">
        <code>
          {isLong && !open ? lines.slice(0, 8).join("\n") + "\n..." : code}
        </code>
      </pre>
      {isLong && (
        <button
          className="mt-1 text-xs text-blue-600 dark:text-blue-300 hover:underline focus:outline-none"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
