import React from "react";
import { Info, AlertCircle, AlertTriangle, Lightbulb, Ban } from "lucide-react";

type NoteProps = {
  children: React.ReactNode;
  variant?: "note" | "tip" | "important" | "warning" | "caution";
};

export default function Note({ children, variant = "note" }: NoteProps) {
  const styles = {
    note: {
      border: "border-l-4 border-blue-500 dark:border-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      title: "text-blue-700 dark:text-blue-300",
      icon: <Info className="w-5 h-5" />,
      label: "Note",
    },
    tip: {
      border: "border-l-4 border-green-500 dark:border-green-400",
      bg: "bg-green-50 dark:bg-green-900/20",
      title: "text-green-700 dark:text-green-300",
      icon: <Lightbulb className="w-5 h-5" />,
      label: "Tip",
    },
    important: {
      border: "border-l-4 border-purple-500 dark:border-purple-400",
      bg: "bg-purple-50 dark:bg-purple-900/20",
      title: "text-purple-700 dark:text-purple-300",
      icon: <AlertCircle className="w-5 h-5" />,
      label: "Important",
    },
    warning: {
      border: "border-l-4 border-amber-500 dark:border-amber-400",
      bg: "bg-amber-50 dark:bg-amber-900/20",
      title: "text-amber-700 dark:text-amber-300",
      icon: <AlertTriangle className="w-5 h-5" />,
      label: "Warning",
    },
    caution: {
      border: "border-l-4 border-red-500 dark:border-red-400",
      bg: "bg-red-50 dark:bg-red-900/20",
      title: "text-red-700 dark:text-red-300",
      icon: <Ban className="w-5 h-5" />,
      label: "Caution",
    },
  };

  const style = styles[variant];

  return (
    <div
      className={`my-6 px-4 pt-4 pb-1 ${style.border} ${style.bg} rounded-md text-gray-700 dark:text-gray-300`}
    >
      <div
        className={`font-medium ${style.title} mb-3 flex items-center gap-2`}
      >
        {style.icon}
        <span>{style.label}</span>
      </div>
      <div className="ml-1">{children}</div>
    </div>
  );
}
