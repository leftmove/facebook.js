import { parse } from "comment-parser";

import Class from "./class";

interface DocumentationProps {
  file: string;
  name: string;
  type: string;
}

export default async function Documentation(props: DocumentationProps) {
  const response = await fetch(
    `https://raw.githubusercontent.com/leftmove/facebook.js/main/src/${props.file}.ts`,
    {
      next: {
        revalidate: 60 * 60 * 24,
      },
    }
  );

  const source = await response.text();
  const comments = parse(source);

  switch (props.type) {
    case "class":
      return <Class comments={comments} />;
    default:
      return (
        <div>
          <h1>{props.name}</h1>
          <p>Unknown documentation type: {props.type}</p>
        </div>
      );
  }
}
