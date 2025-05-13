import { Hono, type Context } from "hono";
import { toFetchResponse, toReqRes } from "fetch-to-node";

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import Facebook, { type Profile } from "../";
import { createMCP } from "./mcp";

const app = new Hono();
const mcpHandler = async (c: Context, profile: Profile) => {
  const { req, res } = toReqRes(c.req.raw);

  const client = new Facebook();
  const server = createMCP(client, profile);

  try {
    const transport: StreamableHTTPServerTransport =
      new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });

    transport.onerror = console.error.bind(console);

    await server.connect(transport);
    await transport.handleRequest(req, res, await c.req.json());

    res.on("close", () => {
      console.log("Request closed");
      transport.close();
      server.close();
    });

    return toFetchResponse(res);
  } catch (e) {
    console.error(e);
    return c.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      },
      { status: 500 }
    );
  }
};

app.get("/", async (c: Context) => {
  return c.text("OK");
});

app.post("/mcp/page", async (c: Context) => await mcpHandler(c, "page"));
app.post("/mcp/user", async (c: Context) => await mcpHandler(c, "user"));

app.get("/mcp", async (c: Context) => {
  console.log("Received GET MCP request");
  return c.json(
    {
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    },
    { status: 405 }
  );
});

app.delete("/mcp", async (c: Context) => {
  console.log("Received DELETE MCP request");
  return c.json(
    {
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    },
    { status: 405 }
  );
});

export default app;
