"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import clsx from "clsx";

import Header from "components/header";
import TableOfContents from "components/toc";

const sidebar: { name: string; items: { href: string; label: string }[] }[] = [
  {
    name: "Navigation",
    items: [
      { href: "/", label: "Overview" },
      { href: "/getting-started", label: "Getting Started" },
      { href: "/authentication", label: "Authentication" },
      { href: "/reference", label: "Reference" },
      { href: "/guides", label: "Guides" },
    ],
  },
];

function SidebarLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={clsx(
        "transition block text-gray-600 dark:text-gray-400 py-1.5 border-l-2 hover:border-cobalt-500 dark:hover:border-cobalt-400 pl-3 -ml-0.5",
        isActive
          ? "text-cobalt-500 dark:text-cobalt-400 border-cobalt-500 dark:border-cobalt-400 font-medium"
          : "hover:text-cobalt-500  dark:hover:text-cobalt-400 border-transparent"
      )}
    >
      {label}
    </Link>
  );
}

export function Sidebar({ show = true }: { show?: boolean }) {
  if (!show) {
    return null;
  }

  return (
    <aside
      className="w-64 xl:w-72 hidden md:block sticky top-20 self-start max-h-[calc(100vh-5rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent"
      data-pagefind-ignore
    >
      <div>
        <nav>
          <ul className="space-y-2 text-sm flex flex-col list-none pl-0">
            {sidebar.flatMap((group) =>
              group.items.map((item) => (
                <li key={item.href}>
                  <SidebarLink {...item} />
                </li>
              ))
            )}
          </ul>
        </nav>
      </div>
      <div className="mt-4">
        <TableOfContents />
      </div>
    </aside>
  );
}

export default function Navigation() {
  return <Header />;
}
