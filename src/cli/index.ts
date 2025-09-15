import { Command } from "commander";
import portfinder from "portfinder";
import express from "express";

import Facebook from "..";
import {
  readFromJSONCredentials,
  writeToJSONCredentials,
} from "../credentials";
import { DEFAULT_FILE_PATH, DEFAULT_CONFIG_PATH, DEFAULT_SCOPE } from "..";
import { CredentialError } from "../errors";
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
  app,
} from "../mcp";

import {
  App,
  LoginStart,
  RefreshStart,
  LoginSuccess,
  CredentialsDisplay,
  CredentialsStored,
  CredentialsJSON,
  CredentialsEnvironmentShell,
} from "./components";
import {
  MCPInitial,
  MCPProfile,
  MCPRequest,
  MCPError,
  MCPClosed,
} from "./components";

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
  .command("json")
  .description(
    "Get easily copy/paste-able JSON credentials to load into your MCP config."
  )
  .action(async () => {
    const facebook = new Facebook();
    const app = new App();

    await facebook.login().then(({ credentials }) => {
      app.render(CredentialsJSON({ credentials }));
    });
  });

credentials
  .command("shell")
  .description(
    "Get easily copy/paste-able environment variables to load into your shell."
  )
  .action(async () => {
    const facebook = new Facebook();
    const app = new App();

    await facebook.login().then(({ credentials }) => {
      app.render(CredentialsEnvironmentShell({ credentials }));
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
  .option("--dual", "Starts the MCP server with dual profiles.", false)
  .action(async (options) => {
    const dual = options.dual;
    const app = new App();
    app.render(MCPInitial);

    try {
      const auth: Authentication = {};
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

    server.use(
      (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        app.render(MCPRequest({ req, res }));
        next();
      }
    );
    server.get(
      ["/mcp/user", "/mcp/page", "/mcp/main"],
      async (req: express.Request, res: express.Response) => {
        res.send("MCP Running");
      }
    );
    server.get("/mcp", sessionHandler);
    server.delete("/mcp", sessionHandler);

    if (dual) {
      server.post(
        "/mcp/main",
        async (req: express.Request, res: express.Response) =>
          await MCPHandler(req, res, "dual")
      );
    } else {
      server.post(
        "/mcp/user",
        async (req: express.Request, res: express.Response) =>
          await MCPHandler(req, res, "user")
      );
      server.post(
        "/mcp/page",
        async (req: express.Request, res: express.Response) =>
          await MCPHandler(req, res, "page")
      );
    }

    const host = "127.0.0.1";
    const port = await portfinder.getPort({ port: 3000, stopPort: 9999, host });
    const listener = server.listen(port, (err: any) => {
      if (err) {
        app.render(MCPError({ message: err }));
        throw err;
      }
    });

    const onListen = () => {
      app.render(MCPProfile({ url: `http://${host}:${port}`, dual }));
    };
    const onError = (err: Error) => {
      app.render(MCPError({ message: err }));
      throw err;
    };
    const onClose = () => {
      app.render(MCPClosed);
      process.exit(0);
    };

    listener.on("listening", onListen);
    listener.on("error", onError);
    listener.on("close", onClose);

    process.on("SIGINT", onClose);
    listener.on("SIGINT", onClose);
    listener.on("SIGTERM", onClose);
  });

mcp
  .command("raw")
  .description(
    "Runs the MCP server through a stdio transport. No output will be displayed."
  )
  .option(
    "--profile <user|page|dual>",
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
      throw new CredentialError(
        "Failed to authenticate the MCP. You may have forgot to login/refresh with your credentials." +
          "\nIf you've never used this library before, you probably need to get API credentials. You can do this by running `npx facebook login`." +
          "\n\nOtherwise, if you're running the MCP from an unfamiliar directory or through a third-party app (like Claude Desktop or your IDE), you need to first make your credentials available globally. You can do this automatically by running `npx facebook credentials store`." +
          "\n\nTLDR: Run the following in a safe directory, and take note of where the credentials are stored.\n`npx facebook login`\n`npx facebook credentials store`",
        e
      );
    }
  });

program.parse();
