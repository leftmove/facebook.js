/** @type {Partial<import("typedoc").TypeDocOptions>} */
const typedocConfig = {
  entryPointStrategy: "expand",
  entryPoints: ["../src"],
  json: "documentation.json",
  exclude: [
    "**/node_modules/**",
    "**/test/**",
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/*.tsx",
    // Exclude CLI sources to avoid React/Ink typings and imports during analysis
    "../src/cli/**/*",
    "src/cli/**/*"
  ],
  includeVersion: true,
  excludePrivate: true,
  excludeProtected: false,
  excludeInternal: false,
  readme: "none",
  tsconfig: "../tsconfig.json",
};

export default typedocConfig;