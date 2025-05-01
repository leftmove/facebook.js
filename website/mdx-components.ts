import { useMDXComponents as getThemeComponents } from "nextra-theme-docs"; // nextra-theme-blog or your custom theme
import type { MDXComponents } from "mdx/types";

const themeComponents = getThemeComponents();

export function useMDXComponents(components: MDXComponents = {}) {
  return {
    ...themeComponents,
    ...components,
  };
}
