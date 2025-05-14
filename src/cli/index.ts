#!/usr/bin/env tsx

import { Command } from "commander";
import portfinder from "portfinder";

import Facebook from "..";
import {
  readFromJSONCredentials,
  writeToJSONCredentials,
} from "../credentials";
import { DEFAULT_FILE_PATH, DEFAULT_CONFIG_PATH, DEFAULT_SCOPE } from "..";
import type { Authentication } from "..";

import {
  appCredentials,
  appTokenCredential,
  userTokenCredential,
  pageTokenCredential,
} from "./token";
import { userIdCredential, pageIdCredential } from "./id";

import {
  app as server,
  createMCP,
  createDualMCP,
  serveStdioMCP,
  MCPHandler,
  sessionHandler,
} from "../mcp";

import {
  App,
  LoginStart,
  RefreshStart,
  LoginSuccess,
  CredentialsDisplay,
  CredentialsStored,
  CredentialsLoaded,
} from "./components";
import { MCPInitial, MCPProfile, MCPRequest, MCPError } from "./components";

const program = new Command();

program
  .name("Facebook.js Command")
  .description("The CLI tool for facebook.js and Facebook authentication.");

const credentials = program
  .command("credentials")
  .alias("creds")
  .description("Credential commands.");

credentials
  .command("view")
  .description("View credentials.")
  .action(async () => {
    const auth: Authentication = { profile: "page" };
    const facebook = new Facebook(auth);
    const app = new App();
    await facebook
      .login(auth)
      .then(({ credentials, scope }) =>
        app.render(CredentialsDisplay({ credentials, scope }))
      )
      .catch((e) => {
        console.error(e);
      });
  });

credentials
  .command("clear")
  .description("Clear credentials.")
  .action(async () => {
    const auth: Authentication = { profile: "page" };
    const facebook = new Facebook(auth);

    await facebook.writeCredentials({
      appId: undefined,
      appSecret: undefined,
      appToken: undefined,
      userToken: undefined,
      userId: undefined,
      pageId: undefined,
      pageToken: undefined,
    });
  });

credentials
  .command("store")
  .description(
    "Store credentials globally. This will create a `credentials.json` that can be used as a fallback for authentication globally."
  )
  .action(async () => {
    const facebook = new Facebook();
    const app = new App();

    await facebook.login().then(({ credentials }) => {
      writeToJSONCredentials(credentials, DEFAULT_CONFIG_PATH);
      app.render(CredentialsStored({ path: DEFAULT_CONFIG_PATH }));
    });
  });

credentials
  .command("load")
  .description(
    "Get easily copy/paste-able credentials to load into your command line or JSON config."
  )
  .action(async () => {
    const facebook = new Facebook();
    const app = new App();

    await facebook.login().then(({ credentials }) => {
      app.render(CredentialsLoaded({ credentials }));
    });
  });

program
  .command("login")
  .description("Authenticate Facebook credentials.")
  .option("--appId", "Facebook App ID.")
  .option("--appSecret", "Facebook App Secret.")
  .option("--appToken", "Facebook App Token.")
  .option("--userToken", "Facebook User Token.")
  .option("--userId", "Facebook User ID.")
  .option("--pageId", "Facebook Page ID.")
  .option("--pageIndex", "Facebook Page Index.")
  .option("--pageToken", "Facebook Page Token.")
  .option("--scope", "Facebook permissions scope, given as a JSON string.")
  .option("--credentials", "Facebook credentials.", DEFAULT_FILE_PATH)
  .option("--path", "Path to the credentials file.")
  .action(async (options) => {
    const credentials = readFromJSONCredentials(options.credentials);
    const scope =
      (options.scope ? JSON.parse(options.scope) : undefined) ||
      (credentials?.scope &&
      Object.keys(credentials.scope as Object).length === 0
        ? undefined
        : credentials.scope) ||
      DEFAULT_SCOPE;

    const app = new App();
    app.render(LoginStart);

    const { appId, appSecret } = await appCredentials(
      options.appId || credentials.appId || undefined,
      options.appSecret || credentials.appSecret || undefined
    );

    let appToken = options.appToken || credentials.appToken || undefined;
    let userToken = options.userToken || credentials.userToken || undefined;
    let userId = options.userId || credentials.userId || undefined;
    let pageId = options.pageId || credentials.pageId || undefined;
    let pageIndex = options.pageIndex || credentials.pageIndex || undefined;
    let pageToken = options.pageToken || credentials.pageToken || undefined;

    const facebook = new Facebook({
      id: appId,
      secret: appSecret,
      appToken,
      userToken,
      userId,
      pageId,
      pageToken,
      pageIndex,
      scope,
    });

    appToken = await appTokenCredential(facebook, app, appToken);
    userToken = await userTokenCredential(facebook, app, scope, userToken);
    userId = await userIdCredential(facebook, app, userId);
    pageId = await pageIdCredential(facebook, app, pageId, pageIndex);
    pageToken = await pageTokenCredential(facebook, app, pageToken);

    const path = options.path || DEFAULT_FILE_PATH;
    writeToJSONCredentials(
      { appId, appSecret, appToken, userToken, userId, pageId, pageToken },
      path
    );

    app.render(LoginSuccess);
  });

program
  .command("refresh")
  .description("Authenticate Facebook credentials.")
  .option("--appId", "Facebook App ID.")
  .option("--appSecret", "Facebook App Secret.")
  .option("--appToken", "Facebook App Token.")
  .option("--userToken", "Facebook User Token.")
  .option("--userId", "Facebook User ID.")
  .option("--pageId", "Facebook Page ID.")
  .option("--pageIndex", "Facebook Page Index.")
  .option("--pageToken", "Facebook Page Token.")
  .option("--scope", "Facebook permissions scope, given as a JSON string.")
  .option("--credentials", "Facebook credentials.", DEFAULT_FILE_PATH)
  .option("--path", "Path to the credentials file.")
  .action(async (options) => {
    const credentials = readFromJSONCredentials(options.credentials);
    const scope =
      (options.scope ? JSON.parse(options.scope) : undefined) ||
      (Object.keys(credentials.scope as Object).length === 0
        ? undefined
        : credentials.scope) ||
      DEFAULT_SCOPE;

    const app = new App();
    app.render(RefreshStart);

    const { appId, appSecret } = await appCredentials(
      options.appId || credentials.appId || undefined,
      options.appSecret || credentials.appSecret || undefined
    );

    let appToken = undefined;
    let userToken = undefined;
    let userId = undefined;
    let pageId = undefined;
    let pageIndex = undefined;
    let pageToken = undefined;

    const facebook = new Facebook({
      id: appId,
      secret: appSecret,
      appToken,
      userToken,
      userId,
      pageId,
      pageToken,
      pageIndex,
      scope,
    });

    appToken = await appTokenCredential(facebook, app, appToken);
    userToken = await userTokenCredential(facebook, app, scope, userToken);
    userId = await userIdCredential(facebook, app, userId);
    pageId = await pageIdCredential(facebook, app, pageId, pageIndex);
    pageToken = await pageTokenCredential(facebook, app, pageToken);

    const path = options.path || DEFAULT_FILE_PATH;
    writeToJSONCredentials(
      { appId, appSecret, appToken, userToken, userId, pageId, pageToken },
      path
    );

    app.render(LoginSuccess);
  });

const mcp = program.command("mcp").description("Commands for the MCP server.");

mcp
  .command("start")
  .description("Starts the MCP server through streamable HTTP.")
  .option(
    "--profile",
    "The profile to login with. Accepts 'user', 'page'.",
    "page"
  )
  .option("--dual", "Starts the MCP server with dual profiles.", false)
  .action(async (options) => {
    const profile = options.profile;
    const dual = options.dual;
    const app = new App();
    app.render(MCPInitial);

    try {
      const auth: Authentication = { profile };
      const facebook = new Facebook();
      await facebook.login(auth).catch((e) => {
        throw e;
      });
    } catch (e) {
      throw new Error(
        "Failed to authenticate the MCP. You may have forgot to login/refresh with your credentials." +
          "\nIf you've never used this library before, you probably need to get API credentials. You can do this by running `npx facebook login`." +
          "\n\nOtherwise, if you're running the MCP from an unfamiliar directory or through a third-party app (like Claude Desktop or your IDE), you need to first make your credentials available globally. You can do this automatically by running `npx facebook credentials store`." +
          "\n\nTLDR: Run the following in a safe directory, and take note of where the credentials are stored.\n`npx facebook login`\n`npx facebook credentials store`"
      );
    }

    server.use((req, res, next) => {
      app.render(MCPRequest({ req, res }));
      next();
    });
    server.get(["/mcp/user", "/mcp/page", "/mcp/main"], async (req, res) => {
      res.send("MCP Running");
    });
    server.get("/mcp", sessionHandler);
    server.delete("/mcp", sessionHandler);

    if (dual) {
      server.post(
        "/mcp/main",
        async (req, res) => await MCPHandler(req, res, "dual")
      );
    } else {
      server.post(
        "/mcp/user",
        async (req, res) => await MCPHandler(req, res, "user")
      );
      server.post(
        "/mcp/page",
        async (req, res) => await MCPHandler(req, res, "page")
      );
    }

    portfinder.getPort(
      { port: 3000, stopPort: 9999, host: "127.0.0.1" },
      (err, port) => {
        if (err) {
          app.render(MCPError({ message: err }));
        } else {
          server.listen(port, (err) => {
            if (err) {
              app.render(MCPError({ message: err }));
            } else {
              app.render(MCPProfile({ url: `http://127.0.0.1:${port}`, dual }));
            }
          });
        }
      }
    );
  });

mcp
  .command("raw")
  .description(
    "Runs the MCP server through a stdio transport. No output will be displayed."
  )
  .option(
    "--profile",
    "The profile to use. Accepts 'user', 'page', or 'dual'.",
    "page"
  )
  .action(async (options) => {
    try {
      const profile = options.profile;
      const facebook = new Facebook();
      await facebook.login().catch((e) => {
        throw e;
      });

      const server =
        profile === "dual"
          ? createDualMCP(facebook)
          : createMCP(facebook, profile);
      return await serveStdioMCP(server);
    } catch (e) {
      throw new Error(
        "Failed to authenticate the MCP. You may have forgot to login/refresh with your credentials." +
          "\nIf you've never used this library before, you probably need to get API credentials. You can do this by running `npx facebook login`." +
          "\n\nOtherwise, if you're running the MCP from an unfamiliar directory or through a third-party app (like Claude Desktop or your IDE), you need to first make your credentials available globally. You can do this automatically by running `npx facebook credentials store`." +
          "\n\nTLDR: Run the following in a safe directory, and take note of where the credentials are stored.\n`npx facebook login`\n`npx facebook credentials store`"
      );
    }
  });

program.parse();
