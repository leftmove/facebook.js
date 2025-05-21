"use client";

import { useState } from "react";
import Link from "next/link";

// Static menu component
function StaticMenu() {
  return (
    <nav className="flex gap-6 text-sm">
      <Link href="/" className="text-gray-600 hover:text-cobalt-500 transition">
        Home
      </Link>
      <Link
        href="/getting-started"
        className="text-gray-600 hover:text-cobalt-500 transition"
      >
        Getting Started
      </Link>
      <Link
        href="https://github.com/leftmove/facebook.js"
        target="_blank"
        rel="noopener"
        className="text-gray-600 hover:text-cobalt-500 transition"
      >
        Contribute
      </Link>
    </nav>
  );
}

// Mobile menu component
function MobileMenu() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="relative">
      {/* Mobile menu button */}
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
          className="w-6 h-6 text-gray-600"
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

      {/* Desktop menu */}
      <div className="hidden md:flex gap-6 text-sm">
        <Link
          href="/"
          className="text-gray-600 hover:text-cobalt-500 transition"
        >
          Home
        </Link>
        <Link
          href="/getting-started"
          className="text-gray-600 hover:text-cobalt-500 transition"
        >
          Getting Started
        </Link>
        <Link
          href="https://github.com/leftmove/facebook.js"
          target="_blank"
          rel="noopener"
          className="text-gray-600 hover:text-cobalt-500 transition"
        >
          Contribute
        </Link>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2 z-50 md:hidden">
          <Link
            href="/"
            className="block px-4 py-2 text-gray-600 hover:text-cobalt-500 hover:bg-gray-50"
          >
            Home
          </Link>
          <Link
            href="/getting-started"
            className="block px-4 py-2 text-gray-600 hover:text-cobalt-500 hover:bg-gray-50"
          >
            Getting Started
          </Link>
          <Link
            href="https://github.com/leftmove/facebook.js"
            target="_blank"
            rel="noopener"
            className="block px-4 py-2 text-gray-600 hover:text-cobalt-500 hover:bg-gray-50"
          >
            Contribute
          </Link>
        </div>
      )}
    </nav>
  );
}

// Main menu component that can be imported
export default function Menu() {
  return (
    <>
      {/* Show mobile menu on smaller screens */}
      <div className="md:hidden">
        <MobileMenu />
      </div>

      {/* Show static menu on medium and larger screens */}
      <div className="hidden md:block">
        <StaticMenu />
      </div>
    </>
  );
}
