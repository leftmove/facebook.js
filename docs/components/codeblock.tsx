import React, { Fragment } from "react";
import { codeToHast } from "shiki";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { jsx, jsxs } from "react/jsx-runtime";

import clsx from "clsx";

interface CodeProps {
  language: string;
  children:
    | {
        props: {
          children: {
            props: {
              children: string;
            };
          };
        };
      }
    | string;
}

export async function Code(props: CodeProps) {
  const codeContent =
    typeof props.children === "string"
      ? props.children
      : props.children.props.children.props.children;
  const out = await codeToHast(codeContent, {
    lang: props.language,
    themes: {
      light: "github-light",
      dark: "github-dark",
    },
  });

  return toJsxRuntime(out, {
    Fragment,
    jsx,
    jsxs,
    components: {
      pre: (props) => (
        <pre
          data-custom-codeblock
          {...props}
          className={clsx("p-6", props.className)}
        />
      ),
    },
  }) as React.JSX.Element;
}

export default function Block(props: CodeProps) {
  return (
    <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
      <Code {...props} />
    </div>
  );
}
