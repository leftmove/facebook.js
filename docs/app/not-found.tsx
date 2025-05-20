import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4"
      data-pagefind-ignore
    >
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-8">
        <span className="text-5xl font-bold text-gray-400">404</span>
      </div>

      <h1 className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
      <p className="text-lg text-gray-600 max-w-lg mb-8">
        Sorry, we couldn&apos;t find the page you&apos;re looking for. It might
        have been moved or doesn&apos;t exist.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/"
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Home
        </Link>
        <Link
          href="/docs"
          className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          View Documentation
        </Link>
      </div>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl w-full">
        <Link
          href="/docs"
          className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
        >
          <h3 className="font-semibold text-gray-900 mb-1">Documentation</h3>
          <p className="text-sm text-gray-600">
            Explore our guides and examples
          </p>
        </Link>

        <Link
          href="/docs/getting-started"
          className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
        >
          <h3 className="font-semibold text-gray-900 mb-1">Getting Started</h3>
          <p className="text-sm text-gray-600">
            Quick start guide for new users
          </p>
        </Link>

        <a
          href="https://github.com/anonyo/facebook.js"
          className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
        >
          <h3 className="font-semibold text-gray-900 mb-1">GitHub</h3>
          <p className="text-sm text-gray-600">
            View source code and contribute
          </p>
        </a>
      </div>
    </div>
  );
}
