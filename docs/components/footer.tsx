import Link from "next/link";

export default function Footer() {
  return (
    <footer
      className="w-full border-t border-gray-200 bg-gray-50 py-8 mt-8"
      data-pagefind-ignore
    >
      <div className="mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600">
        <div>
          <Link
            href="https://developers.facebook.com/docs/graph-api"
            target="_blank"
            rel="noopener"
            className="text-gray-600 hover:text-cobalt-500 transition"
          >
            Meta
          </Link>
        </div>
        <div className="flex gap-6">
          <Link
            href="/"
            className="text-gray-600 hover:text-cobalt-500 transition"
          >
            Home
          </Link>
          <Link
            href="/getting-started"
            className="text-gray-600 hover:text-cobalt-500 transition"
          >
            Getting Started
          </Link>
          <a
            href="https://github.com/leftmove/facebook.js"
            target="_blank"
            rel="noopener"
            className="text-gray-600 hover:text-cobalt-500 transition"
          >
            Source Code
          </a>
        </div>
      </div>
    </footer>
  );
}
