"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4"
      data-pagefind-ignore
    >
      <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-4 mb-6">
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-red-600 dark:text-red-400"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
        Something went wrong
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
        We&apos;re sorry, but there was an error processing your request.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="px-4 py-2 rounded-lg bg-cobalt-600 text-white hover:bg-cobalt-700 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  );
}
