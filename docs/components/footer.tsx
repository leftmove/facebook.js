import Link from "next/link";

export default function Footer() {
  return (
    <footer
      className="w-full border-t border-gray-200 bg-gray-50 py-8 mt-8"
      data-pagefind-ignore
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600">
        <div>© {new Date().getFullYear()} facebook.js.</div>
        <div className="flex gap-6">
          <Link
            href="/"
            className="text-gray-600 hover:text-blue-600 transition"
          >
            Home
          </Link>
          <Link
            href="/getting-started"
            className="text-gray-600 hover:text-blue-600 transition"
          >
            Getting Started
          </Link>
          <Link
            href="/components"
            className="text-gray-600 hover:text-blue-600 transition"
          >
            Components
          </Link>
          <a
            href="https://github.com/anonyo/facebook.js"
            target="_blank"
            rel="noopener"
            className="text-gray-600 hover:text-blue-600 transition"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
