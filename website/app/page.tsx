import Link from "next/link";

const terminal = `npm install @anonyo/facebook.js # Install the package.
npx facebook login # After installation, authenticate within a trusted directory.`;
const code = `import Facebook from "../src";
import type { Authentication } from "../src";

const facebook = new Facebook();
const auth: Authentication = {
  profile: "page",
};
await facebook.login(auth).then(({ credentials, scope }) => {
  console.log(credentials);
  console.log(scope);
});`;

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full bg-gradient-to-b from-primary to-secondary text-white py-20 px-4 flex flex-col items-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">facebook.js</h1>
          <p className="text-xl md:text-2xl mb-8">
            A modern Facebook API wrapper for JavaScript
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/documentation"
              className="px-6 py-3 bg-white text-primary rounded-lg font-medium hover:bg-opacity-90 transition-all"
            >
              Documentation
            </Link>
            <Link
              href="https://github.com/anonyo/facebook.js"
              className="px-6 py-3 bg-transparent border-2 border-white rounded-lg font-medium hover:bg-white hover:bg-opacity-10 hover:text-primary transition-all"
            >
              Source Code
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-44 w-full mx-auto bg-gray-900">
        <h2 className="text-3xl font-bold text-center mb-12 text-white">
          Why use this library?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "TypeScript",
              description:
                "Work with code directly instead of HTTP requests, and let TypeScript handle your inputs to create less cluttered, more organized logic.",
            },
            {
              title: "Ease",
              description:
                "Write your code faster, easier, and simpler, with a syntax designed for the best developer experience.",
            },
            {
              title: "Artificial Intelligence",
              description:
                "Play with the built-in MCP (model context protocol) to use for anything AI.",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="p-8 relative border-l-4 border-primary bg-white shadow-sm hover:shadow-md transition-all"
            >
              <h3 className="text-2xl font-bold mb-4 text-primary">
                {feature.title}
              </h3>
              <p className="text-gray-700 text-lg leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Code Example Section */}
      <section className="w-full bg-gray-50 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            Quick Start
          </h2>
          <div className="bg-gray-900 rounded-xl p-6 text-gray-100 font-mono text-sm overflow-x-auto mb-10">
            <pre>{terminal}</pre>
          </div>

          <div className="bg-gray-900 rounded-xl p-6 mt-8 text-gray-100 font-mono text-sm overflow-x-auto mb-10">
            <pre>{code}</pre>
          </div>
          <div className="text-center">
            <Link
              href="/docs"
              className="inline-flex items-center px-6 py-3 border-2 border-primary text-primary bg-transparent rounded-md font-medium hover:bg-primary hover:text-white transition-all duration-300"
            >
              <span className="font-bold">View Documentation</span>
            </Link>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="w-full py-8 px-4 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p>© {new Date().getFullYear()} leftmove/facebook.js</p>
          </div>
          <div className="flex gap-6">
            <Link href="/docs" className="hover:text-white transition-colors">
              Documentation
            </Link>
            <Link
              href="https://github.com/anonyo/facebook.js"
              className="hover:text-white transition-colors"
            >
              Source Code
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
