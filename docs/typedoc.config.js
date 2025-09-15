/** @type {Partial<import("typedoc").TypeDocOptions>} */
const typedocConfig = {
  entryPointStrategy: "expand",
  entryPoints: ["../src"],
  json: "documentation.json",
  exclude: ["**/node_modules/**", "**/test/**", "**/*.test.ts", "**/*.spec.ts", "**/*.tsx"],
  includeVersion: true,
  excludePrivate: true,
  excludeProtected: false,
  excludeInternal: false,
  readme: "none",
  tsconfig: "../tsconfig.json",
};

export default typedocConfig;