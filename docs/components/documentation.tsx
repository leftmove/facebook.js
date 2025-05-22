"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Code,
  Book,
  Hash,
  FileText,
  Zap,
  Star,
} from "lucide-react";
import clsx from "clsx";

import DocumentationJSON from "documentation" with { type: "json" };

interface TypeInfo {
  type: string;
  name?: string;
  target?: number;
  elementType?: TypeInfo;
}

interface DocItem {
  id: number;
  name: string;
  variant: string;
  kind: number;
  flags?: Record<string, boolean>;
  comment?: {
    summary?: Array<{ kind: string; text: string }>;
    blockTags?: Array<{
      tag: string;
      content: Array<{ kind: string; text: string; target?: unknown }>;
    }>;
  };
  children?: DocItem[];
  sources?: Array<{
    fileName: string;
    line: number;
    character: number;
    url: string;
  }>;
  type?: TypeInfo;
  signatures?: Array<{
    id: number;
    name: string;
    parameters?: Array<{
      id: number;
      name: string;
      type: TypeInfo;
      comment?: {
        summary?: Array<{ kind: string; text: string }>;
      };
      defaultValue?: string;
    }>;
    type?: TypeInfo;
    comment?: {
      summary?: Array<{ kind: string; text: string }>;
      blockTags?: Array<{
        tag: string;
        content: Array<{ kind: string; text: string; target?: unknown }>;
      }>;
    };
  }>;
  defaultValue?: string;
}

interface DocumentationData {
  children: DocItem[];
}

interface Props {
  file: string;
  abstraction: string;
  showSearch?: boolean;
}

const kindMap: Record<
  number,
  { name: string; icon: React.ReactNode; color: string }
> = {
  1: {
    name: "Project",
    icon: <Book className="w-4 h-4" />,
    color: "text-cobalt-600 dark:text-cobalt-400",
  },
  2: {
    name: "Module",
    icon: <FileText className="w-4 h-4" />,
    color: "text-green-600 dark:text-green-400",
  },
  128: {
    name: "Class",
    icon: <Code className="w-4 h-4" />,
    color: "text-purple-600 dark:text-purple-400",
  },
  512: {
    name: "Constructor",
    icon: <Zap className="w-4 h-4" />,
    color: "text-yellow-600 dark:text-yellow-400",
  },
  1024: {
    name: "Property",
    icon: <Hash className="w-4 h-4" />,
    color: "text-gray-600 dark:text-gray-400",
  },
  2048: {
    name: "Method",
    icon: <Star className="w-4 h-4" />,
    color: "text-red-600 dark:text-red-400",
  },
  16384: {
    name: "Signature",
    icon: <Code className="w-4 h-4" />,
    color: "text-indigo-600 dark:text-indigo-400",
  },
  4194304: {
    name: "Reference",
    icon: <ExternalLink className="w-4 h-4" />,
    color: "text-orange-600 dark:text-orange-400",
  },
};

function extractText(
  content: Array<{ kind: string; text: string }> = []
): string {
  return content
    .map((item) => item.text)
    .join("")
    .trim();
}

function getItemComment(item: DocItem): DocItem["comment"] | undefined {
  if (item.kind === 2048 && item.signatures && item.signatures.length > 0) {
    const firstSignature = item.signatures[0];
    if (firstSignature.comment) {
      return firstSignature.comment;
    }
  }
  
  return item.comment;
}

function renderComment(comment?: DocItem['comment']) {
  if (!comment) return null

  const summary = extractText(comment.summary)
  const paramTags = comment.blockTags?.filter(tag => tag.tag === '@param') || []
  const returnTags = comment.blockTags?.filter(tag => tag.tag === '@returns') || []
  const throwsTags = comment.blockTags?.filter(tag => tag.tag === '@throws') || []

  return (
    <div className="space-y-3">
      {summary && (
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
          {summary}
        </p>
      )}

      {paramTags.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Parameters:</h4>
          <ul className="space-y-1">
            {paramTags.map((tag, idx) => (
              <li key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                {extractText(tag.content)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {returnTags.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Returns:</h4>
          <ul className="space-y-1">
            {returnTags.map((tag, idx) => (
              <li key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                {extractText(tag.content)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {throwsTags.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Throws:</h4>
          <ul className="space-y-1">
            {throwsTags.map((tag, idx) => (
              <li key={idx} className="text-sm text-red-600 dark:text-red-400">
                {extractText(tag.content)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function TypeDisplay({ type }: { type: TypeInfo }) {
  if (!type) return null;

  let typeDisplay = "";
  if (type.type === "intrinsic") {
    typeDisplay = type.name || "unknown";
  } else if (type.type === "reference") {
    typeDisplay = type.name || "Reference";
  } else if (type.type === "array") {
    typeDisplay = `${type.elementType?.name || "unknown"}[]`;
  } else {
    typeDisplay = type.type || "unknown";
  }

  return (
    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
      {typeDisplay}
    </span>
  );
}

function SourceLink({ sources }: { sources?: DocItem["sources"] }) {
  if (!sources || sources.length === 0) return null;

  const source = sources[0];
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center text-xs text-cobalt-600 dark:text-cobalt-400 hover:text-cobalt-800 dark:hover:text-cobalt-300 transition-colors"
    >
      <ExternalLink className="w-3 h-3 mr-1" />
      {source.fileName}:{source.line}
    </a>
  );
}

function DocNode({ item, depth = 0 }: { item: DocItem; depth?: number }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedSignatures, setExpandedSignatures] = useState<Set<number>>(new Set())
  const hasChildren = item.children && item.children.length > 0
  const kindInfo = kindMap[item.kind] || { name: 'Unknown', icon: <Hash className="w-4 h-4" />, color: 'text-gray-400 dark:text-gray-500' }

  const isInherited = item.flags?.isInherited
  const itemComment = getItemComment(item)

  const toggleSignature = (signatureId: number) => {
    const newExpanded = new Set(expandedSignatures)
    if (newExpanded.has(signatureId)) {
      newExpanded.delete(signatureId)
    } else {
      newExpanded.add(signatureId)
    }
    setExpandedSignatures(newExpanded)
  }

  return (
    <div className={clsx(
      'border rounded-lg bg-white dark:bg-gray-900 shadow-sm transition-all duration-200',
      depth === 0 ? 'border-gray-300 dark:border-gray-600' : 'border-gray-200 dark:border-gray-700',
      isInherited && 'bg-gray-50 dark:bg-gray-800'
    )}>
      <div 
        className={clsx(
          'p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
          hasChildren && 'border-b border-gray-200 dark:border-gray-700'
        )}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {hasChildren && (
              <button className="flex-shrink-0 mt-1.5">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                )}
              </button>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <span className={kindInfo.color}>
                  {kindInfo.icon}
                </span>
                <span className={clsx(
                  'font-semibold',
                  depth === 0 ? 'text-xl text-gray-900 dark:text-gray-100' : 'text-lg text-gray-800 dark:text-gray-200'
                )}>
                  {item.name}
                </span>
                <span className={clsx(
                  'px-2 py-1 rounded-full text-xs font-medium',
                  kindInfo.color.includes('cobalt') && 'bg-cobalt-100 dark:bg-cobalt-900/30 text-cobalt-800 dark:text-cobalt-300',
                  kindInfo.color.includes('green') && 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
                  kindInfo.color.includes('purple') && 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
                  kindInfo.color.includes('yellow') && 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
                  kindInfo.color.includes('gray') && 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300',
                  kindInfo.color.includes('red') && 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
                  kindInfo.color.includes('indigo') && 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300',
                  kindInfo.color.includes('orange') && 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                )}>
                  {kindInfo.name}
                </span>
                {isInherited && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                    Inherited
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-4 mb-3">
                {item.type && <TypeDisplay type={item.type} />}
                {item.defaultValue && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Default: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{item.defaultValue}</code>
                  </span>
                )}
                <SourceLink sources={item.sources} />
              </div>

              {renderComment(itemComment)}

              {item.signatures && item.signatures.length > 0 && (
                <div className="mt-4 space-y-3">
                  {item.signatures.map((sig, idx) => {
                    const isSignatureExpanded = expandedSignatures.has(sig.id || idx)
                    return (
                      <div key={sig.id || idx} className="bg-gray-50 dark:bg-gray-800 rounded-md overflow-hidden">
                        <div 
                          className="p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleSignature(sig.id || idx)
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-mono text-sm text-gray-800 dark:text-gray-200">
                              {sig.name}({sig.parameters?.map(p => `${p.name}: ${p.type?.name || 'unknown'}`).join(', ')})
                            </div>
                            <button className="flex-shrink-0 ml-2">
                              {isSignatureExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                              )}
                            </button>
                          </div>
                        </div>
                        
                        {isSignatureExpanded && (
                          <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-600">
                            <div className="pt-3">
                              {renderComment(sig.comment)}
                              {sig.parameters && sig.parameters.length > 0 && (
                                <div className="mt-3">
                                  <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Parameters:</h5>
                                  <div className="space-y-2">
                                    {sig.parameters.map((param, pidx) => (
                                      <div key={param.id || pidx} className="flex items-start space-x-2">
                                        <span className="font-mono text-sm text-gray-800 dark:text-gray-200 font-medium">
                                          {param.name}
                                        </span>
                                        <TypeDisplay type={param.type} />
                                        {param.defaultValue && (
                                          <span className="text-xs text-gray-500 dark:text-gray-400">
                                            = {param.defaultValue}
                                          </span>
                                        )}
                                        {param.comment && (
                                          <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {extractText(param.comment.summary)}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
          {item.children!.map((child) => (
            <DocNode key={child.id} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Documentation({ file, abstraction, showSearch = false }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKind, setSelectedKind] = useState<number | null>(null);
  const [documentationData, setDocumentationData] =
    useState<DocumentationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDocumentation = async () => {
      try {
        setDocumentationData(DocumentationJSON as DocumentationData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load documentation"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadDocumentation();
  }, []);

  const targetItem = useMemo(() => {
    if (!documentationData) return null;

    function findItem(items: DocItem[], name: string): DocItem | null {
      for (const item of items) {
        if (item.name === name) {
          return item;
        }
        if (item.children) {
          const found = findItem(item.children, name);
          if (found) return found;
        }
      }
      return null;
    }

    return findItem(documentationData.children, abstraction);
  }, [documentationData, abstraction]);

  const filteredChildren = useMemo(() => {
    if (!targetItem?.children) return [];

    return targetItem.children.filter((item) => {
      const itemComment = getItemComment(item);
      const matchesSearch =
        !searchTerm ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        extractText(itemComment?.summary)
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesKind = !selectedKind || item.kind === selectedKind;

      return matchesSearch && matchesKind;
    });
  }, [targetItem, searchTerm, selectedKind]);

  const availableKinds = useMemo(() => {
    if (!targetItem?.children) return [];

    const kinds = new Set(targetItem.children.map((item) => item.kind));
    return Array.from(kinds).map((kind) => ({
      kind,
      ...kindMap[kind],
      count: targetItem.children!.filter((item) => item.kind === kind).length,
    }));
  }, [targetItem]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cobalt-600 dark:border-cobalt-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading documentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-red-900 dark:text-red-400 mb-4">
            Error Loading Documentation
          </h2>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Make sure the documentation.json file exists and is accessible.
          </p>
        </div>
      </div>
    );
  }

  if (!targetItem) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Documentation Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Could not find documentation for{" "}
            <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-900 dark:text-gray-100">{abstraction}</code>{" "}
            in <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-900 dark:text-gray-100">{file}</code>.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Make sure the class or abstraction exists and has been documented
            with TSDoc.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <span>{file}</span>
          <span>›</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">{abstraction}</span>
        </div>
        
        <DocNode item={targetItem} depth={0} />
      </div>

      {showSearch && targetItem.children && targetItem.children.length > 0 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cobalt-500 dark:focus:ring-cobalt-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedKind(null)}
                className={clsx(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  !selectedKind 
                    ? 'bg-cobalt-500 dark:bg-cobalt-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                All
              </button>
              {availableKinds.map(({ kind, name, icon, color, count }) => (
                <button
                  key={kind}
                  onClick={() => setSelectedKind(selectedKind === kind ? null : kind)}
                  className={clsx(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1',
                    selectedKind === kind
                      ? 'bg-cobalt-500 dark:bg-cobalt-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  )}
                >
                  <span className={selectedKind === kind ? 'text-white' : color}>
                    {icon}
                  </span>
                  <span>{name}</span>
                  <span className="bg-white dark:bg-gray-900 bg-opacity-20 dark:bg-opacity-20 px-1.5 py-0.5 rounded text-xs">
                    {count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filteredChildren.length > 0 ? (
              filteredChildren.map(child => (
                <DocNode key={child.id} item={child} depth={1} />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No items match your search criteria.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
