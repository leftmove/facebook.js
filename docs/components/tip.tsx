import React from "react";

export default function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 p-4 border-l-4 border-blue-500 bg-blue-50 rounded-md text-gray-700">
      <div className="font-medium text-blue-700 mb-1">Tip</div>
      <div>{children}</div>
    </div>
  );
}
