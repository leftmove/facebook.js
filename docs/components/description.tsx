import Link from "next/link";
import { Code, Zap, Sparkle } from "lucide-react";

import Codeblock from "components/codeblock";

const codeExample = `import Facebook from 'bookface';
import type { Authentication } from 'bookface';

// Initialize the client
const facebook = new Facebook();
const auth: Authentication = { };

// Login with your credentials (unnecessary but good to have)
await facebook.login(auth).then(({ credentials, scope }) => {
  console.log(credentials);
  console.log(scope);
});

// Publish a post to your page
const post = await facebook.page.posts.publish({
  message: "Hello World!",
  media: "./image.png"
});

// Read your page posts
const posts = await facebook.page.posts.read();`;

export default function Description() {
  return (
    <div className="flex flex-col items-center">
      <div className="w-2/3 mt-12 mx-auto space-y-6">
        <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-50/50 border border-gray-100">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Code className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-base leading-relaxed">
            Work with code directly instead of HTTP requests, and let TypeScript
            handle your inputs to create less cluttered, more organized logic.
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-50/50 border border-gray-100">
          <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-base leading-relaxed">
            Write your code faster, easier, and simpler, with a syntax designed
            for the best developer experience.
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-50/50 border border-gray-100">
          <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <Sparkle className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-base leading-relaxed">
            Run the built-in MCP (model context protocol) to prompt with all
            things AI.
          </div>
        </div>
      </div>

      <div className="w-2/3 mt-12 mx-auto">
        <Codeblock language="typescript">{codeExample}</Codeblock>
      </div>

      <span className="text-center text-lg w-3/4 mx-auto mt-10">
        The Graph API is Meta&apos;s platform for building apps and services
        that interact with their products (i.e. Facebook, Instagram). Bookface
        is your (opinionated) one-stop shop for interacting with the Graph API
        through a more intuitive, organized, and straightforward syntax.
      </span>

      <span className="text-center text-lg w-3/4 mx-auto mt-10">
        To get started with Bookface, check out the{" "}
        <Link href="/getting-started">getting started</Link> guide.
      </span>
    </div>
  );
}
