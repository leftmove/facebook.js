"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiLink,
  FiCode,
  FiChevronRight,
  FiArrowRight,
  FiFileText,
  FiTag,
} from "react-icons/fi";

interface SourceToken {
  start: string;
  delimiter: string;
  postDelimiter: string;
  tag: string;
  postTag: string;
  name: string;
  postName: string;
  type: string;
  postType: string;
  description: string;
  end: string;
  lineEnd: string;
}

interface SourceLine {
  number: number;
  source: string;
  tokens: SourceToken;
}

interface CommentTag {
  tag: string;
  name: string;
  type: string;
  optional: boolean;
  description: string;
  problems: string[];
  source: SourceLine[];
}

interface CommentItem {
  description: string;
  tags: CommentTag[];
  source: SourceLine[];
  problems: string[];
}

interface ClassDocsProps {
  comments: CommentItem[];
  className?: string;
  contextDescription?: string;
}

const Badge = ({
  children,
  color,
}: {
  children: React.ReactNode;
  color: string;
}) => (
  <span
    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${color}`}
  >
    {children}
  </span>
);

const TypeBadge = ({ type }: { type: string }) => {
  // Extract type from {@link Type} format if present
  const linkMatch = type.match(/{@link\s+([^}]+)}/);
  const cleanType = linkMatch ? linkMatch[1] : type.replace(/[{}]/g, "");

  return (
    <Badge color="bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-400/20">
      {linkMatch ? (
        <Link
          href={`#${cleanType}`}
          className="flex items-center gap-1 hover:underline"
        >
          <span>{cleanType}</span>
          <FiLink size={12} />
        </Link>
      ) : (
        cleanType
      )}
    </Badge>
  );
};

// Only show a specific tag type once in the tag list
const Tags = ({ tags }: { tags: CommentTag[] }) => {
  // Get unique tag types
  const uniqueTags = Array.from(new Set(tags.map((tag) => tag.tag)));

  const colorMap: Record<string, string> = {
    param:
      "bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-900/30 dark:text-purple-300 dark:ring-purple-400/20",
    returns:
      "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-300 dark:ring-green-400/20",
    property:
      "bg-yellow-50 text-yellow-700 ring-yellow-600/20 dark:bg-yellow-900/30 dark:text-yellow-300 dark:ring-yellow-400/20",
    see: "bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-900/30 dark:text-indigo-300 dark:ring-indigo-400/20",
    type: "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-400/20",
    default:
      "bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-500/20",
  };

  // Only show first 3 unique tag types
  return (
    <div className="flex gap-1">
      {uniqueTags.slice(0, 3).map((tag, i) => (
        <Badge key={i} color={colorMap[tag] || colorMap.default}>
          <div className="flex items-center gap-1">
            <FiTag size={10} />
            <span>{tag}</span>
            {/* Show count if more than 1 of this tag */}
            {tags.filter((t) => t.tag === tag).length > 1 && (
              <span className="ml-0.5 text-xs opacity-80">
                ({tags.filter((t) => t.tag === tag).length})
              </span>
            )}
          </div>
        </Badge>
      ))}
      {/* Only show "more" indicator if we have many different tag types, not just many of the same tag */}
      {uniqueTags.length > 3 && (
        <span className="text-xs text-gray-500 dark:text-gray-400 self-center">
          +{uniqueTags.length - 3} more
        </span>
      )}
    </div>
  );
};

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = React.useState(true);

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left text-lg font-semibold mb-2 flex items-center gap-2 text-gray-800 dark:text-gray-200"
      >
        <FiChevronRight
          className={`text-blue-500 dark:text-blue-400 transition-transform duration-200 ${
            isOpen ? "transform rotate-90" : ""
          }`}
        />
        {title}
      </button>
      {isOpen && (
        <div className="pl-5 border-l-2 border-gray-100 dark:border-gray-700">
          {children}
        </div>
      )}
    </div>
  );
};

const Parameters = ({ tags }: { tags: CommentTag[] }) => {
  const params = tags.filter((tag) => tag.tag === "param");
  if (params.length === 0) return null;

  return (
    <Section title="Parameters">
      <div className="space-y-3">
        {params.map((param, i) => (
          <div
            key={i}
            className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3"
          >
            <div className="flex flex-wrap items-start gap-2 mb-2">
              <span className="font-mono text-sm text-blue-600 dark:text-blue-400">
                {param.name}
              </span>
              {param.type && <TypeBadge type={param.type} />}
              {param.optional && (
                <Badge color="bg-gray-100 text-gray-500 ring-gray-500/20 dark:bg-gray-700 dark:text-gray-400 dark:ring-gray-500/20">
                  optional
                </Badge>
              )}
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              {param.description}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
};

const Returns = ({ tags }: { tags: CommentTag[] }) => {
  const returns = tags.find((tag) => tag.tag === "returns");
  if (!returns) return null;

  return (
    <Section title="Returns">
      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {returns.type && <TypeBadge type={returns.type} />}
        </div>
        <p className="text-gray-700 dark:text-gray-300 text-sm">
          {returns.description}
        </p>
      </div>
    </Section>
  );
};

const Properties = ({ tags }: { tags: CommentTag[] }) => {
  const properties = tags.filter((tag) => tag.tag === "property");
  if (properties.length === 0) return null;

  return (
    <Section title="Properties">
      <div className="grid gap-3">
        {properties.map((prop, i) => (
          <div
            key={i}
            className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3"
          >
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-mono text-sm text-amber-700 dark:text-amber-400">
                {prop.name}
              </span>
              {prop.type && <TypeBadge type={prop.type} />}
              {prop.optional && (
                <Badge color="bg-gray-100 text-gray-500 ring-gray-500/20 dark:bg-gray-700 dark:text-gray-400 dark:ring-gray-500/20">
                  optional
                </Badge>
              )}
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              {prop.description}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
};

const Links = ({ tags }: { tags: CommentTag[] }) => {
  const seeLinks = tags.filter((tag) => tag.tag === "see");
  if (seeLinks.length === 0) return null;

  return (
    <Section title="See Also">
      <ul className="list-disc list-inside space-y-2 text-blue-600 dark:text-blue-400">
        {seeLinks.map((link, i) => {
          const linkMatch = link.type.match(/{@link\s+([^}]+)}/);
          const linkText = linkMatch ? linkMatch[1] : link.type;

          return (
            <li key={i} className="flex items-center gap-2">
              <FiArrowRight size={14} />
              <Link href={`#${linkText}`} className="hover:underline">
                {linkText}
              </Link>
            </li>
          );
        })}
      </ul>
    </Section>
  );
};

// Generalized function to extract a name from a comment item
const getName = (item: CommentItem, index: number): string => {
  // First try to get the function or class name from the description
  // This will match words at the start of a description
  const nameMatch = item.description.match(/^([\w]+)/);
  const baseName = nameMatch ? nameMatch[1] : "";

  // If this is a function or method description, use its name
  if (item.tags.some((t) => t.tag === "param" || t.tag === "returns")) {
    // For functions, keep the name as is
    return baseName;
  }

  // Look for class name
  const classTag = item.tags.find((t) => t.tag === "class");
  if (classTag && classTag.name) {
    return classTag.name;
  }

  // If this is a "Returns" type, extract a more descriptive name
  if (baseName === "Returns") {
    // Try to find what kind of object this returns
    const returnsMatch = item.description.match(
      /Returns\s+.*?\s+with\s+methods\s+for\s+interacting\s+with\s+([\w\s]+)/i
    );
    if (returnsMatch && returnsMatch[1]) {
      const objectType = returnsMatch[1].trim().replace(/\.$/, ""); // Remove trailing period if any
      return objectType.charAt(0).toUpperCase() + objectType.slice(1);
    }
    return "ReturnType" + index;
  }

  return baseName || "Item" + index;
};

const Item = ({ item, index }: { item: CommentItem; index: number }) => {
  // Get a more specific name for the item
  const name = getName(item, index);

  // To help categorize the item
  const isFunction = item.tags.some(
    (t) => t.tag === "param" || t.tag === "returns"
  );
  const isInterface = item.tags.some((t) => t.tag === "property");

  // Determine category more specifically
  let category = "Type";
  let categoryBgColor =
    "bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-500/20";
  let icon = <FiFileText size={14} />;

  if (isFunction) {
    category = "Function";
    categoryBgColor =
      "bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-900/30 dark:text-indigo-300 dark:ring-indigo-400/20";
    icon = <FiCode size={14} />;
  } else if (isInterface) {
    category = "Interface";
    categoryBgColor =
      "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-400/20";
    icon = <FiFileText size={14} />;
  } else if (
    item.description.toLowerCase().includes("class") ||
    item.tags.some((t) => t.tag === "class")
  ) {
    category = "Class";
    categoryBgColor =
      "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-400/20";
    icon = <FiFileText size={14} />;
  } else if (item.description.toLowerCase().includes("returns")) {
    // For return types, be more specific about what they return
    const returnsMatch = item.description.match(
      /Returns\s+.*?\s+with\s+methods\s+for\s+interacting\s+with\s+([\w\s]+)/i
    );
    if (returnsMatch && returnsMatch[1]) {
      const objectType = returnsMatch[1].trim().replace(/\.$/, ""); // Remove trailing period if any
      category = `${
        objectType.charAt(0).toUpperCase() + objectType.slice(1)
      } Object`;
    } else {
      category = "Return Type";
    }
    categoryBgColor =
      "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-300 dark:ring-green-400/20";
    icon = <FiFileText size={14} />;
  }

  // Enhanced description with better formatting
  const enhancedDescription = () => {
    // Don't modify function or interface descriptions
    if (isFunction || isInterface) {
      return item.description;
    }

    // For return types, add more explanation
    if (item.description.toLowerCase().includes("returns")) {
      // Find what the object is related to
      const returnsMatch = item.description.match(
        /Returns\s+.*?\s+with\s+methods\s+for\s+interacting\s+with\s+([\w\s]+)/i
      );
      if (returnsMatch && returnsMatch[1]) {
        const objectType = returnsMatch[1].trim().replace(/\.$/, "");
        return `A specialized object that provides methods for working with ${objectType}. Use this to manage and interact with ${objectType} through the API.`;
      }
    }

    return item.description;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-12 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm"
    >
      <div className="p-5 bg-white dark:bg-gray-800">
        <div className="flex items-start justify-between mb-4">
          <div className="flex flex-col">
            <div className="flex gap-2 items-center mb-2">
              <Badge color={categoryBgColor}>
                <div className="flex items-center gap-1">
                  {icon}
                  <span>{category}</span>
                </div>
              </Badge>
              {name && (
                <h2
                  className="text-xl font-semibold text-gray-900 dark:text-white"
                  id={name}
                >
                  {name}
                </h2>
              )}
            </div>
            {/* Show type information from @type if available */}
            {item.tags.some((tag) => tag.tag === "type") && (
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span className="font-medium">Type: </span>
                {item.tags.find((tag) => tag.tag === "type")?.type && (
                  <TypeBadge
                    type={
                      item.tags.find((tag) => tag.tag === "type")?.type || ""
                    }
                  />
                )}
              </div>
            )}
          </div>
          <Tags tags={item.tags} />
        </div>

        <p className="text-gray-700 dark:text-gray-300 mb-6">
          {enhancedDescription()}
        </p>

        {/* Show usage examples if it's a function or class */}
        {(isFunction ||
          item.description.toLowerCase().includes("class") ||
          item.tags.some((t) => t.tag === "class")) && (
          <Section title="Usage">
            <div className="bg-gray-50 dark:bg-gray-800/80 rounded-lg p-3 font-mono text-sm mb-4 overflow-x-auto">
              {isFunction && (
                <code className="text-blue-600 dark:text-blue-400">
                  {/* Use direct JSX for the code example */}
                  const {name === "Get" ? "result" : name.toLowerCase()} ={" "}
                  {name}(
                  {item.tags
                    .filter((t) => t.tag === "param")
                    .map((p, i, arr) => (
                      <React.Fragment key={i}>
                        {p.name}
                        {i < arr.length - 1 ? ", " : ""}
                      </React.Fragment>
                    ))}
                  );
                </code>
              )}
              {!isFunction && (
                <code className="text-blue-600 dark:text-blue-400">
                  {/* Use direct JSX for the code example */}
                  const {name.charAt(0).toLowerCase() + name.slice(1)} = new{" "}
                  {name}(
                  {item.tags
                    .filter((t) => t.tag === "param")
                    .map((p, i, arr) => (
                      <React.Fragment key={i}>
                        {p.name}
                        {i < arr.length - 1 ? ", " : ""}
                      </React.Fragment>
                    ))}
                  );
                </code>
              )}
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
              {isFunction ? (
                <>
                  The {name} function{" "}
                  {item.description.toLowerCase().replace(/^get\s+/, "gets ")}
                </>
              ) : (
                <>
                  The {name} class provides functionality to{" "}
                  {item.description
                    .toLowerCase()
                    .replace(/^.*?\. /, "")
                    .replace(/\.$/, "")}
                </>
              )}
            </p>
          </Section>
        )}

        <Parameters tags={item.tags} />
        <Returns tags={item.tags} />
        <Properties tags={item.tags} />
        <Links tags={item.tags} />
      </div>
    </motion.div>
  );
};

// Main component to display documentation for a class
export const Class: React.FC<ClassDocsProps> = ({
  comments,
  className = "API Documentation",
  contextDescription = "Complete documentation for this API.",
}) => {
  // Group comments by type with improved categorization
  const interfaces = comments.filter((comment: CommentItem) =>
    comment.tags.some((t: CommentTag) => t.tag === "property")
  );

  const functions = comments.filter(
    (comment: CommentItem) =>
      comment.tags.some(
        (t: CommentTag) => t.tag === "param" || t.tag === "returns"
      ) && !comment.tags.some((t: CommentTag) => t.tag === "property")
  );

  // Better categorize the "others" group
  const classes = comments.filter(
    (comment: CommentItem) =>
      !comment.tags.some((t: CommentTag) => t.tag === "property") &&
      !comment.tags.some(
        (t: CommentTag) => t.tag === "param" || t.tag === "returns"
      ) &&
      (comment.description.toLowerCase().includes("class") ||
        comment.tags.some((t: CommentTag) => t.tag === "class"))
  );

  const returnTypes = comments.filter(
    (comment: CommentItem) =>
      !comment.tags.some((t: CommentTag) => t.tag === "property") &&
      !comment.tags.some(
        (t: CommentTag) => t.tag === "param" || t.tag === "returns"
      ) &&
      comment.description.toLowerCase().includes("returns") &&
      !comment.description.toLowerCase().includes("class") &&
      !comment.tags.some((t: CommentTag) => t.tag === "class")
  );

  const others = comments.filter(
    (comment: CommentItem) =>
      !comment.tags.some((t: CommentTag) => t.tag === "property") &&
      !comment.tags.some(
        (t: CommentTag) => t.tag === "param" || t.tag === "returns"
      ) &&
      !comment.description.toLowerCase().includes("class") &&
      !comment.description.toLowerCase().includes("returns") &&
      !comment.tags.some((t: CommentTag) => t.tag === "class")
  );

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          {className}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {contextDescription}
        </p>
        <p className="text-gray-600 dark:text-gray-400">
          To get started, choose a component from the table of contents below.
        </p>
      </div>

      {/* Table of Contents */}
      <div className="mb-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
          Table of Contents
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {interfaces.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-1">
                <FiFileText className="text-amber-500 dark:text-amber-400" />
                <span>Interfaces</span>
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Data structures and configuration objects
              </p>
              <ul className="space-y-1">
                {interfaces.map((comment: CommentItem, i: number) => {
                  const name = getName(comment, i);
                  return (
                    <li key={i}>
                      <Link
                        href={`#${name}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                      >
                        {name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {functions.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-1">
                <FiCode className="text-indigo-500 dark:text-indigo-400" />
                <span>Functions</span>
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Utility functions and methods
              </p>
              <ul className="space-y-1">
                {functions.map((comment: CommentItem, i: number) => {
                  const name = getName(comment, i);
                  return (
                    <li key={i}>
                      <Link
                        href={`#${name}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                      >
                        {name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Combine classes and return types in the third column */}
          {(classes.length > 0 ||
            returnTypes.length > 0 ||
            others.length > 0) && (
            <div>
              {classes.length > 0 && (
                <>
                  <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-1">
                    <FiFileText className="text-blue-500 dark:text-blue-400" />
                    <span>Classes</span>
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Core API classes
                  </p>
                  <ul className="space-y-1 mb-4">
                    {classes.map((comment: CommentItem, i: number) => {
                      const name = getName(comment, i);
                      return (
                        <li key={i}>
                          <Link
                            href={`#${name}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                          >
                            {name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}

              {returnTypes.length > 0 && (
                <>
                  <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-1">
                    <FiFileText className="text-green-500 dark:text-green-400" />
                    <span>Return Objects</span>
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Objects returned by API methods
                  </p>
                  <ul className="space-y-1 mb-4">
                    {returnTypes.map((comment: CommentItem, i: number) => {
                      const name = getName(comment, i);
                      return (
                        <li key={i}>
                          <Link
                            href={`#${name}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                          >
                            {name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}

              {others.length > 0 && (
                <>
                  <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-1">
                    <FiFileText className="text-gray-500 dark:text-gray-400" />
                    <span>Others</span>
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Additional types and utilities
                  </p>
                  <ul className="space-y-1">
                    {others.map((comment: CommentItem, i: number) => {
                      const name = getName(comment, i);
                      return (
                        <li key={i}>
                          <Link
                            href={`#${name}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                          >
                            {name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Interfaces */}
      {interfaces.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <FiFileText className="text-amber-500 dark:text-amber-400" />
            <span>Interfaces</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Interfaces define the structure of objects used throughout the API.
            They specify the shape and types of data that you&apos;ll work with.
          </p>
          {interfaces.map((comment: CommentItem, i: number) => (
            <Item key={i} item={comment} index={i} />
          ))}
        </div>
      )}

      {/* Functions */}
      {functions.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <FiCode className="text-indigo-500 dark:text-indigo-400" />
            <span>Functions</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Utility functions that provide specific functionality for working
            with the API. These functions handle common operations and can be
            used independently.
          </p>
          {functions.map((comment: CommentItem, i: number) => (
            <Item key={i} item={comment} index={i} />
          ))}
        </div>
      )}

      {/* Classes */}
      {classes.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <FiFileText className="text-blue-500 dark:text-blue-400" />
            <span>Classes</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Core classes that provide the main functionality of the API. These
            classes encapsulate related methods and properties.
          </p>
          {classes.map((comment: CommentItem, i: number) => (
            <Item key={i} item={comment} index={i} />
          ))}
        </div>
      )}

      {/* Return Types */}
      {returnTypes.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <FiFileText className="text-green-500 dark:text-green-400" />
            <span>Return Objects</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Objects returned by various API methods that provide specialized
            functionality for working with specific resources.
          </p>
          {returnTypes.map((comment: CommentItem, i: number) => (
            <Item key={i} item={comment} index={i} />
          ))}
        </div>
      )}

      {/* Others */}
      {others.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <FiFileText className="text-gray-500 dark:text-gray-400" />
            <span>Other Components</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Additional types and utilities that don&apos;t fit into the other
            categories but are still important parts of the API.
          </p>
          {others.map((comment: CommentItem, i: number) => (
            <Item key={i} item={comment} index={i} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Class;
