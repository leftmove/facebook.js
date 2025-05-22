import Link from "next/link";
import Image from "next/image";

import clsx from "clsx";

import Menu from "components/menu";
import Search from "components/search";
import TableOfContents from "components/toc";

const sidebar: { name: string; items: { href: string; label: string }[] }[] = [
  {
    name: "Navigation",
    items: [
      { href: "/", label: "Overview" },
      { href: "/getting-started", label: "Getting Started" },
      { href: "/posts", label: "Posts" },
    ],
  },
  {
    name: "Reference",
    items: [{ href: "/reference/post", label: "Post" }],
  },
];

async function SidebarLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className={`hover:text-cobalt-200 dark:hover:text-cobalt-100 transition block text-gray-600 dark:text-gray-400 ${"text-cobalt-500 dark:text-cobalt-100"}`}
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
      className="w-44 hidden md:block border-r border-gray-200 dark:border-gray-700 sticky top-20 self-start max-h-[calc(100vh-5rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent"
      data-pagefind-ignore
    >
      <nav>
        <ul className="space-y-4 text-sm">
          {sidebar.map((item) => (
            <li key={item.name}>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 mt-0">
                {item.name}
              </h3>
              <ul className="space-y-4 text-sm">
                {item.items.map((item) => (
                  <li key={item.href}>
                    <SidebarLink {...item} />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </nav>
      <TableOfContents />
    </aside>
  );
}

const Overlay = () => {
  const gradient =
    "absolute sm:object-fill object-cover border-none [mask-image:linear-gradient(90deg,rgba(0,0,0,1)_40%,rgba(0,0,0,0)_100%)] [webkit-mask-image:linear-gradient(90deg,rgba(0,0,0,1)_40%,rgba(0,0,0,0)_100%)]";
  return (
    <>
      <Image
        src="/logo-light.png"
        alt="Bookface"
        fill={true}
        className={clsx(gradient, "dark:hidden")}
      />
      <Image
        src="/logo-dark.png"
        alt="Bookface"
        fill={true}
        className={clsx(gradient, "dark:block hidden opacity-80")}
      />
    </>
  );
};

export function Logo() {
  return (
    <div className="relative w-84 h-full flex items-center justify-end font-bold tracking-tight text-gray-900 dark:text-gray-100">
      <Link href="/">
        <span className="z-10 text-cobalt-300 dark:text-cobalt-400 font-bold text-3xl sm:mr-18">
          [ thebookface ]
        </span>
        <Overlay />
      </Link>
    </div>
  );
}

export default function Navigation() {
  return (
    <header
      className="sticky top-0 flex h-20 justify-between z-30 w-full border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur text-nowrap transition-colors"
      data-pagefind-ignore
    >
      <Logo />
      <div className="ml-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Menu />
          <Search />
        </div>
      </div>
    </header>
  );
}
