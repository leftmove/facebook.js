import express from "express";

import { MCPHandler, sessionHandler } from "./mcp";

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  app.emit("request", req, res);
  next();
});

app.get(["/mcp/user", "/mcp/page"], async (req, res) => {
  res.send("MCP Running");
});

app.post("/mcp/user", async (req, res) => await MCPHandler(req, res, "user"));
app.post("/mcp/page", async (req, res) => await MCPHandler(req, res, "page"));

app.get("/mcp", sessionHandler);
app.delete("/mcp", sessionHandler);

export function serve(port: number = 3000, callback?: () => void) {
  return app.listen(port, callback);
}

export { app };
