import Link from "next/link";

export default function Hero() {
  return (
    <div className="relative py-16 sm:py-24 md:py-32 bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-sm border border-gray-100 mb-12 overflow-hidden ">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[size:50px_50px] bg-cobalt-400"></div>
      <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold bg-white bg-clip-text text-transparent mb-6">
          Bookface
        </h1>
        <p className="text-lg md:text-2xl text-gray-100 mb-8">
          A modern Facebook API wrapper for TypeScript.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/getting-started"
            className="inline-block px-6 py-3 rounded-lg bg-cobalt-700 text-white border-cobalt-800 font-semibold shadow-lg hover:shadow-xl hover:bg-cobalt-900 transition-all"
          >
            Get Started
          </Link>
          <Link
            href="https://github.com/anonyo/facebook.js"
            target="_blank"
            rel="noopener"
            className="inline-block px-6 py-3 rounded-lg bg-cobalt-700 backdrop-blur border border-cobalt-800 text-white font-semibold hover:bg-cobalt-900 hover:shadow-md transition-all"
          >
            Contribute
          </Link>
        </div>
      </div>
      <div className="absolute inset-0 pointer-events-none -z-10 opacity-25 flex items-center justify-center">
        <div className="absolute w-[800px] h-[800px] bg-gradient-to-r from-blue-400/20 to-blue-600/20 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}
