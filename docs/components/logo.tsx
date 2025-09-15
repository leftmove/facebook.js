"use client";

import Link from "next/link";
import Image from "next/image";

import clsx from "clsx";

function Overlay() {
  const gradient =
    "absolute sm:object-fill object-cover object-left border-none [mask-image:linear-gradient(90deg,rgba(0,0,0,0)_0%,rgba(0,0,0,1)_15%,rgba(0,0,0,1)_70%,rgba(0,0,0,0)_100%)] [webkit-mask-image:linear-gradient(90deg,rgba(0,0,0,0)_0%,rgba(0,0,0,1)_15%,rgba(0,0,0,1)_70%,rgba(0,0,0,0)_100%)]";
  return (
    <>
      <Image
        src="/logo-light.png"
        alt="Bookface"
        fill={true}
        className={clsx(gradient, "dark:hidden")}
      />
      <Image
        src="/logo-dark.png"
        alt="Bookface"
        fill={true}
        className={clsx(gradient, "dark:block hidden opacity-80")}
      />
    </>
  );
}

export default function Logo({
  isMinimized = false,
}: {
  isMinimized?: boolean;
}) {
  return (
    <div
      className={clsx(
        "relative flex items-center justify-end font-bold tracking-tight text-gray-900 dark:text-gray-100 transition-all duration-700 ease-in-out",
        isMinimized ? "w-40 h-full" : "w-96 h-full"
      )}
    >
      <Link href="/">
        <span
          className={clsx(
            "z-10 text-cobalt-300 dark:text-cobalt-400 font-bold transition-all duration-700 ease-in-out",
            isMinimized ? "text-xl sm:mr-8" : "text-3xl sm:mr-18"
          )}
        >
          {isMinimized ? "" : "[ thebookface ]"}
        </span>
        {!isMinimized && <Overlay />}
      </Link>
    </div>
  );
}
