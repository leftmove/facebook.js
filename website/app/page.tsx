import { Navigation } from "@/components/home/Navigation";
import { getReadme, getRepoInfo } from "@/lib/github";
import { marked } from "marked";
import type { FC } from "react";

const Home: FC = async () => {
  const [readme, repoInfo] = await Promise.all([getReadme(), getRepoInfo()]);

  const htmlContent = marked(readme);

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 h-screen w-64 border-r border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800 shadow-md">
        <Navigation />
      </aside>
      <main className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-3xl">
          {/* Hero Section */}
          <section className="mb-8 rounded-xl bg-white/80 p-8 shadow dark:bg-gray-800/80">
            <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">
              {repoInfo.name}
            </h1>
            <p className="mb-4 text-lg text-gray-600 dark:text-gray-300">
              {repoInfo.description}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href={repoInfo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                <svg
                  className="mr-2 h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                View on GitHub
              </a>
              <a
                href={`${repoInfo.html_url}/tree/${repoInfo.default_branch}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                {repoInfo.default_branch}
              </a>
            </div>
          </section>
          <hr className="my-8 border-gray-300 dark:border-gray-700" />
          {/* README Section */}
          <section className="markdown rounded-xl bg-white/90 p-6 shadow dark:bg-gray-800/90">
            <div
              className="prose prose-lg dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </section>
        </div>
      </main>
    </div>
  );
};

export default Home;
