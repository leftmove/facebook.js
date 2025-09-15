"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const linkStyles =
  "text-gray-700 dark:text-gray-200 hover:text-cobalt-500 dark:hover:text-cobalt-300 transition-colors px-1.5 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded";
const mobileLinkStyles = `block px-4 py-2 ${linkStyles} hover:bg-gray-50 dark:hover:bg-gray-800`;

const menuItems = [
  { href: "/", label: "Home" },
  { href: "/getting-started", label: "Getting Started" },
  {
    href: "https://github.com/leftmove/facebook.js",
    label: "Contribute",
    external: true,
  },
];

function MenuLink({
  href,
  label,
  external = false,
  mobile = false,
}: {
  href: string;
  label: string;
  external?: boolean;
  mobile?: boolean;
}) {
  const pathname = usePathname();
  const props = external ? { target: "_blank", rel: "noopener" } : {};
  const isActive = !external && pathname === href;
  const base = mobile ? mobileLinkStyles : linkStyles;
  const className = `${base} ${
    isActive
      ? "text-cobalt-600 dark:text-cobalt-300 border-b-2 bg-gray-100 dark:bg-gray-900 border-cobalt-500 pb-0.5"
      : ""
  }`;

  return (
    <Link
      href={href}
      className={className}
      aria-current={isActive ? "page" : undefined}
      {...props}
    >
      {label}
    </Link>
  );
}

function StaticMenu() {
  return (
    <nav className="flex gap-6 text-sm">
      {menuItems.map((item) => (
        <MenuLink key={item.href} {...item} />
      ))}
    </nav>
  );
}

function MobileMenu() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="relative">
      <button
        className="md:hidden flex items-center p-2"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="w-6 h-6 text-gray-600 dark:text-gray-400"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={
              mobileMenuOpen
                ? "M6 18L18 6M6 6l12 12"
                : "M4 6h16M4 12h16M4 18h16"
            }
          />
        </svg>
      </button>

      <div className="hidden md:flex gap-6 text-sm">
        {menuItems.map((item) => (
          <MenuLink key={item.href} {...item} />
        ))}
      </div>

      {mobileMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md shadow-lg py-2 z-50 md:hidden">
          {menuItems.map((item) => (
            <MenuLink key={item.href} {...item} mobile />
          ))}
        </div>
      )}
    </nav>
  );
}

export default function Menu() {
  return (
    <>
      <div className="md:hidden">
        <MobileMenu />
      </div>
      <div className="hidden md:block">
        <StaticMenu />
      </div>
    </>
  );
}
