"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { ThemeSwitcher } from "../ui/ThemeSwitcher";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [year, setYear] = useState<number>();

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <nav className="mx-auto flex max-w-7xl items-center justify-between p-4">
          <div className="flex items-center">
            <Link
              href="/"
              className="text-2xl font-bold text-gray-900 dark:text-white"
            >
              Facebook.js
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeSwitcher />
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl p-4">{children}</main>
      <footer className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl p-4">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            © {year} Facebook.js. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
