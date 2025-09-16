"use client";

// Beware.
// Entire file is vibe-coded garbage.

import { useCallback, useEffect, useState, useRef } from "react";

interface SearchResult {
  title: string;
  excerpt: string;
  url: string;
  id?: string;
  highlights?: {
    text: string;
    position: string;
  }[];
  section?: string;
}

interface PagefindSearchResult {
  id: string;
  data: () => Promise<{
    meta: {
      title: string;
    };
    excerpt: string;
    url: string;
    content?: string;
    positions?: string[];
    filters?: Record<string, string[]>;
    word_count?: number;
    locations?: string[];
  }>;
  words?: string[];
  score?: number;
  positions?: string[];
}

interface PagefindInstance {
  search: (query: string) => Promise<{
    results: PagefindSearchResult[];
  }>;
  debouncedSearch: (query: string) => Promise<{
    results: PagefindSearchResult[];
  }>;
  highlighter?: {
    highlight: (
      text: string,
      query: string
    ) => { text: string; highlight: boolean }[];
  };
}

// Extend Window interface to include pagefind properties
declare global {
  interface Window {
    pagefind?: PagefindInstance;
    handlePagefindLoad?: (exports: PagefindInstance) => void;
  }
}

export default function Search() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchPanelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize pagefind
  useEffect(() => {
    // Only load in browser, not during SSR
    if (typeof window === "undefined") return;

    console.log("Initializing Pagefind...");

    const loadPagefind = async () => {
      if (!window.pagefind) {
        try {
          setLoading(true);
          console.log("Loading Pagefind script...");

          // Load script as module to resolve import.meta error
          const scriptElement = document.createElement("script");
          scriptElement.src = "/pagefind/pagefind.js";
          scriptElement.type = "module"; // Set type to module

          // Create a global function to receive the pagefind exports
          window.handlePagefindLoad = (exports) => {
            console.log("Pagefind loaded via export handler", exports);
            window.pagefind = exports;
          };

          // Add script that will set window.pagefind after the module loads
          const inlineScript = document.createElement("script");
          inlineScript.type = "module";
          inlineScript.textContent = `
            import * as pagefind from '/pagefind/pagefind.js';
            window.pagefind = pagefind;
            console.log("Pagefind imported:", pagefind);
          `;

          // Handle script loading
          scriptElement.onload = () => {
            console.log("Script loaded successfully, adding inline importer");
            document.body.appendChild(inlineScript);
          };

          scriptElement.onerror = (e) => {
            console.error("Script failed to load:", e);
            setLoading(false);
          };

          document.body.appendChild(scriptElement);

          // Check for pagefind after a delay
          setTimeout(() => {
            if (window.pagefind) {
              console.log("Pagefind object available:", window.pagefind);
            } else {
              console.error("Pagefind script loaded but object not available");

              // Try an alternative approach with direct import
              try {
                const altScript = document.createElement("script");
                altScript.textContent = `
                  // Use dynamic import instead
                  (async () => {
                    try {
                      const pagefind = await import('/pagefind/pagefind.js');
                      console.log("Dynamic import successful:", pagefind);
                      window.pagefind = pagefind;
                    } catch(e) {
                      console.error("Dynamic import failed:", e);
                    }
                  })();
                `;
                document.body.appendChild(altScript);
              } catch (importError) {
                console.error(
                  "Alternative import approach failed:",
                  importError
                );
              }
            }
            setLoading(false);
          }, 1000);
        } catch (e) {
          console.error("Failed to load pagefind:", e);
          setLoading(false);
        }
      } else {
        console.log("Pagefind already loaded");
        setLoading(false);
      }
    };

    loadPagefind();
  }, []);

  // Handle keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }

      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus input when search modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchPanelRef.current &&
        !searchPanelRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Search function
  const handleSearch = useCallback(
    async (value: string) => {
      // Check for window.pagefind directly rather than relying on pagefindLoaded state
      if (!value.trim()) {
        setResults([]);
        return;
      }

      console.log(
        "Searching for:",
        value,
        "Pagefind available:",
        !!window.pagefind
      );

      if (!window.pagefind) {
        console.error("Pagefind not loaded when attempting search");
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        console.log("Performing search with query:", value);

        // Access the search method carefully
        const pagefindSearch =
          window.pagefind.search || window.pagefind.debouncedSearch;

        if (!pagefindSearch) {
          console.error(
            "No search method available on Pagefind object:",
            window.pagefind
          );
          setResults([]);
          setLoading(false);
          return;
        }

        const search = await pagefindSearch(value);
        console.log("Raw search results:", search);

        if (search && search.results && search.results.length > 0) {
          console.log("Found results count:", search.results.length);

          try {
            const searchResults = await Promise.all(
              search.results
                .slice(0, 5)
                .map(async (result: PagefindSearchResult) => {
                  try {
                    const data = await result.data();

                    // Extract the positions/locations if available
                    const locations = result.positions || [];
                    const highlights = locations.map((location) => {
                      // Extract the context around the match
                      const contextStart = data.excerpt.indexOf(value);
                      const start = Math.max(0, contextStart - 20);
                      const end = Math.min(
                        data.excerpt.length,
                        contextStart + value.length + 20
                      );
                      const textContext = data.excerpt.substring(start, end);

                      return {
                        text: textContext,
                        position: location,
                      };
                    });

                    return {
                      id: result.id,
                      title: data.meta.title || "Untitled",
                      excerpt: data.excerpt || "No excerpt available",
                      url: normalizeUrl(data.url || "#"),
                      highlights: highlights.length ? highlights : undefined,
                      section: data.meta.title,
                    };
                  } catch (dataError) {
                    console.error("Error processing result data:", dataError);
                    return null;
                  }
                })
            );

            // Filter out any null results from errors
            const validResults = searchResults.filter(
              (r) => r !== null
            ) as SearchResult[];
            console.log("Processed results:", validResults);
            setResults(validResults);
          } catch (processingError) {
            console.error("Error processing search results:", processingError);
            setResults([]);
          }
        } else {
          console.log("No results found or invalid search response");
          setResults([]);
        }
      } catch (e) {
        console.error("Search failed:", e);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [] // Removed pagefindLoaded dependency since we check directly
  );

  // Helper function to highlight text with the search query
  const highlightText = (text: string) => {
    if (!query || !text) return text;

    // Check if the text already contains <mark> tags (from Pagefind)
    if (text.includes("<mark>")) {
      // Apply our blue styling to the existing mark tags
      const styledText = text.replace(
        /<mark>/g,
        '<mark class="bg-blue-100 text-blue-900 px-1 rounded">'
      );
      // Return the styled HTML
      return <div dangerouslySetInnerHTML={{ __html: styledText }} />;
    }

    // Otherwise, apply our own highlighting
    const regex = new RegExp(`(${escapeRegExp(query)})`, "gi");
    const parts = text.split(regex);

    if (parts.length === 1) return text;

    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-blue-100 text-blue-900 px-1 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // Escape special characters for regex
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  // Normalize Pagefind's HTML file URLs to Next.js routes
  const normalizeUrl = (rawUrl: string): string => {
    if (!rawUrl) return "#";

    const working = rawUrl.trim();

    // Ensure absolute for parsing, then strip origin
    try {
      const parsed = new URL(
        working,
        typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost"
      );
      let pathname = parsed.pathname;

      const lower = pathname.toLowerCase();
      if (lower.endsWith("/index.html")) {
        pathname = pathname.slice(0, -"/index.html".length) + "/";
      }
      if (pathname.toLowerCase().endsWith(".html")) {
        pathname = pathname.slice(0, -".html".length);
      }

      // Ensure leading slash and remove trailing slash (except root)
      if (pathname && !pathname.startsWith("/")) pathname = "/" + pathname;
      if (pathname.length > 1 && pathname.endsWith("/"))
        pathname = pathname.slice(0, -1);

      return `${pathname}${parsed.search}${parsed.hash}` || "/";
    } catch {
      // Fallback: basic string transforms
      let url = working.replace(/\/index\.html$/i, "/").replace(/\.html$/i, "");
      if (url && !url.startsWith("/")) url = "/" + url;
      if (url.length > 1 && url.endsWith("/")) url = url.slice(0, -1);
      return url;
    }
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        // Check if window.pagefind is available before searching
        if (window.pagefind) {
          handleSearch(query);
        } else {
          console.error("Pagefind not available when attempting to search");
          // Try to reload the script if not available
          const scriptElement = document.createElement("script");
          scriptElement.src = "/pagefind/pagefind.js";
          scriptElement.async = true;
          scriptElement.onload = () => {
            console.log("Pagefind script reloaded, retrying search");
            if (window.pagefind) {
              handleSearch(query);
            }
          };
          document.body.appendChild(scriptElement);
        }
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  return (
    <div className="relative z-[9999]" ref={containerRef}>
      {/* Search trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg cursor-pointer border border-gray-200 dark:border-gray-800 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="feather feather-search"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <span>Search</span>
        <span className="hidden sm:flex items-center rounded px-1.5 py-0.5 ml-2 text-xs kbd-hint">
          ⌘K
        </span>
      </button>

      {/* Search modal - rendered at the root level */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] w-screen h-screen flex items-center justify-center p-4 md:p-8 overflow-hidden"
          aria-labelledby="search-modal"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 w-full h-full"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Search panel */}
          <div
            className="absolute z-10 bg-white dark:bg-gray-950 rounded-lg shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden overflow-x-hidden border border-gray-200 dark:border-gray-800"
            ref={searchPanelRef}
          >
            {/* Search input */}
            <div className="sticky top-0 flex items-center p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-400 mr-3"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search documentation..."
                className="flex-1 border-0 focus:ring-0 focus:outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-base"
                autoComplete="off"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>

            {/* Search results */}
            <div className="overflow-y-auto overflow-x-hidden bg-white dark:bg-gray-950 px-4 max-w-full">
              {loading ? (
                <div className="flex justify-center p-6">
                  <svg
                    className="animate-spin h-6 w-6 text-cobalt-600 dark:text-cobalt-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
              ) : results.length > 0 ? (
                <ul className="py-2 max-w-full">
                  {results.map((result, index) => (
                    <li key={result.id || index}>
                      <a
                        href={result.url}
                        className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg transition max-w-full overflow-hidden"
                        onClick={() => setIsOpen(false)}
                      >
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1 truncate max-w-full">
                          {result.title}
                          {result.section &&
                            result.section !== result.title && (
                              <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">
                                ›{" "}
                                <span className="text-cobalt-600 dark:text-cobalt-400">
                                  {result.section}
                                </span>
                              </span>
                            )}
                        </h3>
                        <div className="text-xs text-gray-500 dark:text-gray-400 break-words whitespace-normal max-w-full overflow-hidden">
                          {/* Display excerpt with highlighted matches */}
                          {highlightText(result.excerpt)}
                        </div>

                        {/* Display additional highlight contexts if available */}
                        {result.highlights && result.highlights.length > 0 && (
                          <div className="mt-2 border-t border-gray-100 dark:border-gray-800 pt-2">
                            {result.highlights.map((highlight, i) => (
                              <div
                                key={i}
                                className="mt-1 px-2 py-1 bg-gray-50 dark:bg-gray-900 rounded-md text-xs"
                              >
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-400 dark:text-gray-500 text-[10px] flex-shrink-0 font-mono">
                                    {highlight.position || "•"}
                                  </span>
                                  <div className="text-gray-600 dark:text-gray-300 overflow-hidden break-words whitespace-normal max-w-full">
                                    {highlightText(highlight.text)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : query ? (
                <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                  <p className="font-medium">
                    No results found for &quot;{query}&quot;
                  </p>
                  <p className="text-sm mt-2">
                    Try adjusting your search or filter to find what you&apos;re
                    looking for.
                  </p>
                </div>
              ) : (
                <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                  <p className="font-medium">Type to start searching</p>
                  <p className="text-sm mt-2">
                    Search through titles, content, and more
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 border-t border-gray-200 dark:border-gray-800 px-4 py-2 text-xs text-gray-500 dark:text-gray-400 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
              <span>
                Press{" "}
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded text-xs">
                  ESC
                </kbd>{" "}
                to close
              </span>
              <span>Powered by Pagefind</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
