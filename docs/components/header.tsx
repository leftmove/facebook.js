"use client";

import { useEffect, useRef, useState } from "react";

import clsx from "clsx";

import Logo from "components/logo";
import Menu from "components/menu";
import Search from "components/search";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const isScrolledRef = useRef(false);

  // Hysteresis thresholds to prevent toggle jitter near the boundary
  const SHRINK_THRESHOLD = 120; // shrink when scrolling down past this
  const EXPAND_THRESHOLD = 80; // expand when scrolling up above this

  useEffect(() => {
    isScrolledRef.current = isScrolled;
  }, [isScrolled]);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      if (!isScrolledRef.current && y > SHRINK_THRESHOLD) {
        setIsScrolled(true);
        return;
      }
      if (isScrolledRef.current && y < EXPAND_THRESHOLD) {
        setIsScrolled(false);
        return;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Initialize on mount
    if (typeof window !== "undefined") {
      const initialY = window.scrollY;
      setIsScrolled(initialY > SHRINK_THRESHOLD);
    }
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={clsx(
        "sticky top-0 z-30 w-full border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-nowrap transition-all duration-700 ease-in-out",
        isScrolled ? "h-14" : "h-20"
      )}
      data-pagefind-ignore
    >
      <div
        className={clsx(
          "mx-auto w-full max-w-7xl px-4 sm:px-8 flex items-center justify-between transition-all duration-700 ease-in-out",
          isScrolled ? "h-14" : "h-20"
        )}
      >
        <Logo isMinimized={isScrolled} />
        <div
          className={clsx(
            "flex items-center gap-4 transition-all duration-700 ease-in-out",
            isScrolled ? "py-2" : "py-4"
          )}
        >
          <Menu />
          <Search />
        </div>
      </div>
      <div className="h-0.5 w-full bg-cobalt-200 opacity-20" />
    </header>
  );
}
