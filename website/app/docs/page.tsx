import DocPage from "@/components/docs/DocPage";
import DocsLayout from "@/components/layout/DocsLayout";

const content = `
<div>
  <h2>Features</h2>
  <ul>
    <li><strong>Type Safety</strong>: Built with TypeScript for better developer experience</li>
    <li><strong>Modern API</strong>: Uses modern JavaScript features and async/await</li>
    <li><strong>Comprehensive</strong>: Covers all major Facebook Graph API endpoints</li>
    <li><strong>Well Documented</strong>: Extensive JSDoc documentation</li>
    <li><strong>Active Maintenance</strong>: Regular updates and bug fixes</li>
  </ul>

  <h2>Why Facebook.js?</h2>
  <p>Facebook.js was created to provide a better developer experience when working with the Facebook Graph API. It handles all the complexities of authentication, rate limiting, and error handling, so you can focus on building your application.</p>

  <h2>Getting Started</h2>
  <p>To get started with Facebook.js, check out the <a href="/docs/installation">Installation</a> guide and <a href="/docs/quick-start">Quick Start</a> tutorial.</p>

  <h2>API Reference</h2>
  <p>The API reference is organized by feature:</p>
  <ul>
    <li><a href="/docs/api/client">Client</a> - Core client functionality</li>
    <li><a href="/docs/api/posts">Posts</a> - Managing posts and content</li>
    <li><a href="/docs/api/pages">Pages</a> - Working with Facebook pages</li>
    <li><a href="/docs/api/users">Users</a> - User-related operations</li>
  </ul>

  <h2>Contributing</h2>
  <p>We welcome contributions! Please see our <a href="https://github.com/yourusername/facebook.js/blob/main/CONTRIBUTING.md">Contributing Guide</a> for more information.</p>
</div>
`;

export default function DocsPage() {
  return (
    <DocsLayout>
      <DocPage
        content={content}
        title="Introduction"
        description="A modern, type-safe wrapper for the Facebook Graph API"
      />
    </DocsLayout>
  );
}
