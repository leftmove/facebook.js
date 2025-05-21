import Link from "next/link";
import Image from "next/image";
import Menu from "./menu";
import Search from "./search";
import dynamic from "next/dynamic";

const TableOfContents = dynamic(() => import("./toc"));

export function Sidebar() {
  return (
    <aside
      className="w-64 hidden md:block border-r border-gray-200 pr-6 sticky top-20 self-start max-h-[calc(100vh-5rem)] overflow-y-auto pb-8 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent"
      data-pagefind-ignore
    >
      <nav>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Navigation</h3>
        <ul className="space-y-4 text-sm">
          <li>
            <Link
              href="/"
              className="font-medium text-gray-900 hover:text-cobalt-500 transition block"
            >
              Overview
            </Link>
          </li>
          <li>
            <Link
              href="/getting-started"
              className="text-gray-600 hover:text-cobalt-500 transition block"
            >
              Getting Started
            </Link>
          </li>
          {/* <li>
            <Link
              href="/components"
              className="text-gray-600 hover:text-cobalt-500 transition block"
            >
              Components
            </Link>
          </li> */}
        </ul>
      </nav>

      {/* Table of Contents - dynamically generated from current page headers */}
      <TableOfContents />
    </aside>
  );
}

export function Logo() {
  return (
    <div className="relative w-84 h-full flex items-center justify-end font-bold tracking-tight  text-gray-900">
      <Link href="/">
        <span className="z-10 text-cobalt-300 font-bold text-3xl sm:mr-18">
          [ thebookface ]
        </span>
        <Image
          src="/overlay.png"
          alt="Bookface"
          fill={true}
          className="absolute sm:object-fill object-cover [mask-image:linear-gradient(90deg,rgba(0,0,0,1)_40%,rgba(0,0,0,0)_100%)] [webkit-mask-image:linear-gradient(90deg,rgba(0,0,0,1)_40%,rgba(0,0,0,0)_100%)]"
        />
      </Link>
    </div>
  );
}

export default function Navigation() {
  return (
    <header
      className="sticky top-0 flex h-20 justify-between z-30 w-full border-b border-gray-200 bg-white/80 backdrop-blur text-nowrap"
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
