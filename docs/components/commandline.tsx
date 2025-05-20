import React from "react";

export default function Command({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 overflow-hidden rounded-lg border border-gray-200 bg-gray-900 shadow-sm">
      <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center">
        <div className="flex space-x-2">
          <div className="h-3 w-3 rounded-full bg-red-500"></div>
          <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
          <div className="h-3 w-3 rounded-full bg-green-500"></div>
        </div>
        <div className="text-xs text-gray-400 ml-4">Terminal</div>
      </div>
      <pre className="p-4 text-gray-100 font-mono text-sm overflow-x-auto">
        <code>$ {children}</code>
      </pre>
    </div>
  );
}
