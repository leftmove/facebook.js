"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  {
    title: "Getting Started",
    items: [
      { title: "Introduction", href: "/" },
      { title: "Installation", href: "/docs/installation" },
      { title: "Quick Start", href: "/docs/quick-start" },
    ],
  },
  {
    title: "API Reference",
    items: [
      { title: "Client", href: "/docs/api/client" },
      { title: "Posts", href: "/docs/api/posts" },
      { title: "Pages", href: "/docs/api/pages" },
      { title: "Users", href: "/docs/api/users" },
    ],
  },
  //   {
  //     title: "Guides",
  //     items: [
  //       { title: "Authentication", href: "/docs/guides/authentication" },
  //       { title: "Posting Content", href: "/docs/guides/posting" },
  //       { title: "Error Handling", href: "/docs/guides/errors" },
  //     ],
  //   },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="w-64 space-y-8">
      {navigation.map((section) => (
        <div key={section.title}>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {section.title}
          </h3>
          <ul className="mt-2 space-y-1">
            {section.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block rounded-lg px-3 py-2 text-sm ${
                    pathname === item.href
                      ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                  }`}
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
