import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { initializeMCP } from "./mcp";

import Facebook from "../";
import type { Profile } from "../";

export async function runMCP(
  client: Facebook = new Facebook(),
  profile: Profile = "page",
  callback?: () => void
) {
  const server = initializeMCP(client, profile);
  const transport = new StdioServerTransport();

  return await server.connect(transport);
}

export { initializeMCP };

if (require.main === module) {
  runMCP();
}
