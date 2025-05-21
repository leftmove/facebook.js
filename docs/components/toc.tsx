"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export default function TableOfContents() {
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const headingsRef = useRef<TOCItem[]>([]);

  // Update the ref whenever headings change
  useEffect(() => {
    headingsRef.current = headings;
  }, [headings]);

  // Function to find active heading based on scroll position
  const updateActiveHeading = () => {
    const currentHeadings = headingsRef.current;
    if (currentHeadings.length === 0) return;

    // Get all heading elements that we've identified
    const headingElements = currentHeadings
      .map(({ id }) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (headingElements.length === 0) return;

    // Determine which heading is currently visible
    // Adding a small offset to prefer headings near the top of the viewport
    const scrollY = window.scrollY + 100;

    // Find the last heading that's above the current scroll position
    let currentIndex = -1;
    for (let i = headingElements.length - 1; i >= 0; i--) {
      if (headingElements[i].offsetTop <= scrollY) {
        currentIndex = i;
        break;
      }
    }

    // If we found a heading, set it as active
    if (currentIndex >= 0) {
      setActiveId(currentHeadings[currentIndex].id);
    } else if (headingElements.length > 0) {
      // If no heading is above the fold, use the first one
      setActiveId(currentHeadings[0].id);
    }
  };

  // Extract headings on mount
  useEffect(() => {
    // Extract all heading elements from the document
    const headingElements = Array.from(
      document.querySelectorAll("h1, h2, h3, h4, h5, h6")
    );

    // Convert them to TOC items
    const items = headingElements
      .filter((el) => el.id) // Only include headings with IDs
      .map((el) => ({
        id: el.id,
        text: el.textContent || "",
        level: parseInt(el.tagName.substring(1), 10), // Extract heading level from tag name (H1 -> 1, H2 -> 2, etc.)
      }));

    setHeadings(items);
  }, []);

  // Set up scroll listener in a separate effect
  useEffect(() => {
    // When the page first loads, determine the active heading
    updateActiveHeading();

    // Add scroll event listener to update active heading during scrolling
    window.addEventListener("scroll", updateActiveHeading, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateActiveHeading);
    };
  }, []);

  // Also update active heading when clicking a link
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
      <h3 className="text-sm font-semibold text-gray-900 mb-4">On This Page</h3>
      <nav>
        <ul className="space-y-2 text-sm">
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
                className={`block transition-all duration-200 hover:text-cobalt-500 border-l-2 pl-2 ${
                  activeId === heading.id
                    ? "text-cobalt-500 font-medium border-cobalt-500"
                    : "text-gray-600 border-transparent"
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
