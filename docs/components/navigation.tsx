import Link from "next/link";
import Search from "./search";

export function Menu() {
  return (
    <nav className="flex gap-6 text-sm">
      <Link href="/" className="text-gray-600 hover:text-blue-600 transition">
        Home
      </Link>
      <Link
        href="/getting-started"
        className="text-gray-600 hover:text-blue-600 transition"
      >
        Getting Started
      </Link>
      <Link
        href="/components"
        className="text-gray-600 hover:text-blue-600 transition"
      >
        Components
      </Link>
    </nav>
  );
}

export function Sidebar() {
  return (
    <aside
      className="w-64 hidden md:block border-r border-gray-200 pr-6"
      data-pagefind-ignore
    >
      <nav>
        <ul className="space-y-4 text-sm">
          <li>
            <Link
              href="/"
              className="font-medium text-gray-900 hover:text-blue-600 transition block"
            >
              Introduction
            </Link>
          </li>
          <li>
            <Link
              href="/getting-started"
              className="text-gray-600 hover:text-blue-600 transition block"
            >
              Getting Started
            </Link>
          </li>
          <li>
            <Link
              href="/components"
              className="text-gray-600 hover:text-blue-600 transition block"
            >
              Components
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 font-bold text-xl tracking-tight text-gray-900"
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-blue-600"
      >
        <rect width="28" height="28" rx="6" fill="currentColor" />
        <path
          d="M7 14C7 10.134 10.134 7 14 7C17.866 7 21 10.134 21 14C21 17.866 17.866 21 14 21C10.134 21 7 17.866 7 14Z"
          fill="white"
        />
      </svg>
      facebook.js Docs
    </Link>
  );
}

export default function Navigation() {
  return (
    <header
      className="sticky top-0 z-30 w-full border-b border-gray-200 bg-white/80 backdrop-blur"
      data-pagefind-ignore
    >
      <div className="mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-4">
          <Menu />
          <Search />
        </div>
      </div>
    </header>
  );
}
