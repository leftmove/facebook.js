"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export default function TableOfContents() {
  const pathname = usePathname();
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const headingsRef = useRef<TOCItem[]>([]);

  useEffect(() => {
    headingsRef.current = headings;
  }, [headings]);

  const updateActiveHeading = () => {
    const currentHeadings = headingsRef.current;
    if (currentHeadings.length === 0) return;

    const headingElements = currentHeadings
      .map(({ id }) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (headingElements.length === 0) return;

    const scrollY = window.scrollY + 100;

    let currentIndex = -1;
    for (let i = headingElements.length - 1; i >= 0; i--) {
      if (headingElements[i].offsetTop <= scrollY) {
        currentIndex = i;
        break;
      }
    }

    if (currentIndex >= 0) {
      setActiveId(currentHeadings[currentIndex].id);
    } else if (headingElements.length > 0) {
      setActiveId(currentHeadings[0].id);
    }
  };

  useEffect(() => {
    const headingElements = Array.from(
      document.querySelectorAll("h1, h2, h3, h4, h5, h6")
    );

    const items = headingElements
      .filter((el) => el.id)
      .map((el) => ({
        id: el.id,
        text: el.textContent || "",
        level: parseInt(el.tagName.substring(1), 10),
      }));

    setHeadings(items);
  }, [pathname]);

  useEffect(() => {
    updateActiveHeading();

    window.addEventListener("scroll", updateActiveHeading, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateActiveHeading);
    };
  }, []);

  const handleLinkClick = (id: string) => {
    return () => {
      setActiveId(id);
    };
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <nav>
        <ul className="space-y-2 text-sm pl-0">
          {headings.map((heading) => (
            <li
              key={heading.id}
              style={{
                paddingLeft: `${(heading.level - 1) * 0.75}rem`,
              }}
            >
              <Link
                href={`#${heading.id}`}
                onClick={handleLinkClick(heading.id)}
                className={`block transition-all duration-200 py-1.5 pl-3 -ml-0.5 border-l-2 ${
                  activeId === heading.id
                    ? "text-cobalt-500 dark:text-cobalt-400 border-cobalt-500 dark:border-cobalt-400 font-medium"
                    : "text-gray-600 dark:text-gray-400 border-transparent hover:border-cobalt-500 dark:hover:border-cobalt-400 hover:text-cobalt-500 dark:hover:text-cobalt-400"
                }`}
              >
                {heading.text}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
