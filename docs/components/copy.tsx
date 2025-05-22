"use client";

import React, { useState } from "react";
import { Copy } from "lucide-react";
import clsx from "clsx";

interface CopyButtonProps {
  text: string;
}

export default function CopyButton({ text }: CopyButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleCopy = () => {
    if (isAnimating) return;

    navigator.clipboard.writeText(text);
    setIsAnimating(true);

    setTimeout(() => {
      setIsAnimating(false);
    }, 400);
  };

  return (
    <button
      onClick={handleCopy}
      className={clsx(
        "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-transform duration-150 p-1 rounded-md hover:bg-cobalt-300 dark:hover:bg-cobalt-400 focus:outline-none",
        isAnimating && "animate-wiggle"
      )}
      disabled={isAnimating}
    >
      <Copy size={16} />
    </button>
  );
}
