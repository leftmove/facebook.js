import Link from "next/link";

import Toggle from "components/theme";

export default function Footer() {
  return (
    <footer
      className="w-full border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 py-8 mt-8"
      data-pagefind-ignore
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600 dark:text-gray-300">
        <div>
          <Link
            href="https://developers.facebook.com/docs/graph-api"
            target="_blank"
            rel="noopener"
            className="hover:text-cobalt-500 dark:hover:text-cobalt-400 transition"
          >
            Meta
          </Link>
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="hover:text-cobalt-500 dark:hover:text-cobalt-400 transition"
          >
            Home
          </Link>
          <Link
            href="/getting-started"
            className="hover:text-cobalt-500 dark:hover:text-cobalt-400 transition"
          >
            Getting Started
          </Link>
          <a
            href="https://github.com/leftmove/facebook.js"
            target="_blank"
            rel="noopener"
            className="hover:text-cobalt-500 dark:hover:text-cobalt-400 transition"
          >
            Source Code
          </a>
          <Toggle />
        </div>
      </div>
    </footer>
  );
}
