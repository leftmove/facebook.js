import Link from "next/link";
import type { LinkProps } from "next/link";

import clsx from "clsx";

interface CustomLinkProps extends LinkProps {
  children: React.ReactNode;
  className?: string;
}

export default function CustomLink({
  href,
  className,
  children,
  ...props
}: CustomLinkProps) {
  const isExternal = typeof href === "string" && href.startsWith("http");
  return (
    <Link
      href={href}
      className={clsx("text-cobalt-500 hover:text-cobalt-600", className)}
      {...props}
      target={isExternal ? "_blank" : undefined}
    >
      {children}
    </Link>
  );
}
