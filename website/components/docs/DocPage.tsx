interface DocPageProps {
  content: string;
  title: string;
  description?: string;
}

export default function DocPage({ content, title, description }: DocPageProps) {
  return (
    <article className="prose dark:prose-invert lg:prose-lg">
      <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
        {title}
      </h1>
      {description && (
        <p className="mb-8 text-xl text-gray-600 dark:text-gray-300">
          {description}
        </p>
      )}
      <div
        className="prose prose-lg dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </article>
  );
}
