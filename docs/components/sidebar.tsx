import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamically import the TableOfContents component to avoid hydration errors
const TableOfContents = dynamic(() => import("components/toc"), { ssr: false });

const sidebarItems = [
  { href: "/", label: "Overview" },
  { href: "/getting-started", label: "Getting Started" },
];

function SidebarLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className={`hover:text-cobalt-500 dark:hover:text-cobalt-400 transition block text-gray-600 dark:text-gray-400 py-1.5 border-l-2 border-transparent hover:border-cobalt-500 dark:hover:border-cobalt-400 pl-3 -ml-0.5`}
    >
      {label}
    </Link>
  );
}

export default function Sidebar({
  show = typeof window !== "undefined" && window.location.pathname !== "/",
}: {
  show?: boolean;
}) {
  if (!show) {
    return null;
  }

  return (
    <aside
      className="w-64 hidden lg:block sticky top-14 self-start max-h-[calc(100vh-3.5rem)] overflow-y-auto pb-8 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent"
      data-pagefind-ignore
    >
      <div className="pr-6 border-r border-gray-200 dark:border-gray-700 h-full pt-6">
        <nav>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 pl-3">
            Navigation
          </h3>
          <ul className="space-y-0.5 text-sm mb-8">
            {sidebarItems.map((item) => (
              <li key={item.href}>
                <SidebarLink {...item} />
              </li>
            ))}
          </ul>
        </nav>

        {/* Table of Contents - dynamically generated from current page headers */}
        <TableOfContents />
      </div>
    </aside>
  );
}
