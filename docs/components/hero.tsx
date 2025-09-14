import Link from "next/link";

export default function Hero() {
  return (
    <div className="w-full">
      <div className="relative mx-auto max-w-7xl">
        <div className="relative">
          <div className="relative overflow-hidden bg-gradient-to-br from-cobalt-500 via-cobalt-400 to-cobalt-600 rounded-xl sm:rounded-2xl">
            <div
              className="absolute inset-0 opacity-20 mix-blend-overlay"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4) 0, rgba(255,255,255,0) 40%), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.35) 0, rgba(255,255,255,0) 45%), radial-gradient(circle at 50% 80%, rgba(255,255,255,0.3) 0, rgba(255,255,255,0) 40%)",
              }}
            />
            <div className="mx-auto max-w-7xl px-6 sm:px-8 py-14 sm:py-18 md:py-22 text-center">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-3">
                Bookface
              </h1>
              <p className="text-white/90 text-base md:text-lg mb-8">
                A Facebook API wrapper that&apos;s not from 2011.
              </p>
              <div className="mx-auto inline-flex flex-col sm:flex-row items-center justify-center gap-3 rounded-md bg-white/10 backdrop-blur-sm p-2 ring-1 ring-inset ring-white/20">
                <Link
                  href="/getting-started"
                  className="inline-block px-6 py-3 rounded-md bg-white text-cobalt-700 font-semibold hover:bg-gray-100 transition-colors"
                >
                  Get Started
                </Link>
                <Link
                  href="https://github.com/leftmove/facebook.js"
                  target="_blank"
                  rel="noopener"
                  className="inline-block px-6 py-3 rounded-md bg-cobalt-700/50 border border-white/30 text-white hover:bg-cobalt-700/70 transition-colors"
                >
                  Contribute
                </Link>
              </div>
            </div>
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}
