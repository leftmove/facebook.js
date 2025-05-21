import React from "react";
import { Info, AlertCircle, AlertTriangle, Lightbulb, Ban } from "lucide-react";

type NoteProps = {
  children: React.ReactNode;
  variant?: "note" | "tip" | "important" | "warning" | "caution";
};

export default function Note({ children, variant = "note" }: NoteProps) {
  const styles = {
    note: {
      border: "border-l-4 border-blue-500",
      bg: "bg-blue-50",
      title: "text-blue-700",
      icon: <Info className="w-5 h-5" />,
      label: "Note",
    },
    tip: {
      border: "border-l-4 border-green-500",
      bg: "bg-green-50",
      title: "text-green-700",
      icon: <Lightbulb className="w-5 h-5" />,
      label: "Tip",
    },
    important: {
      border: "border-l-4 border-purple-500",
      bg: "bg-purple-50",
      title: "text-purple-700",
      icon: <AlertCircle className="w-5 h-5" />,
      label: "Important",
    },
    warning: {
      border: "border-l-4 border-amber-500",
      bg: "bg-amber-50",
      title: "text-amber-700",
      icon: <AlertTriangle className="w-5 h-5" />,
      label: "Warning",
    },
    caution: {
      border: "border-l-4 border-red-500",
      bg: "bg-red-50",
      title: "text-red-700",
      icon: <Ban className="w-5 h-5" />,
      label: "Caution",
    },
  };

  const style = styles[variant];

  return (
    <div
      className={`my-6 px-4 pt-4 pb-1 ${style.border} ${style.bg} rounded-md text-gray-700`}
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
