#!/usr/bin/env bun

import { Command } from "commander";
import environmentPaths from "env-paths";
import portfinder from "portfinder";
import express from "express";

import Facebook from "..";
import {
  readFromJSONCredentials,
  writeToJSONCredentials,
} from "../credentials";
import { DEFAULT_FILE_PATH, DEFAULT_SCOPE } from "..";
import type { Authentication } from "..";

import {
  appCredentials,
  appTokenCredential,
  userTokenCredential,
  pageTokenCredential,
} from "./token";
import { userIdCredential, pageIdCredential } from "./id";

import { app as mcp } from "../mcp";

import {
  App,
  LoginStart,
  RefreshStart,
  LoginSuccess,
  CredentialsDisplay,
  CredentialsStored,
} from "./components";
import {
  MCPInitial,
  MCPProfile,
  MCPClose,
  MCPRequest,
  MCPError,
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
    const paths = environmentPaths("facebook.js");
    const facebook = new Facebook();
    const app = new App();

    await facebook.login().then(({ credentials }) => {
      const configPath = `${paths.config}/credentials.json`;
      writeToJSONCredentials(credentials, configPath);
      app.render(CredentialsStored({ path: configPath }));
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

program
  .command("mcp")
  .description("Runs the MCP server.")
  .action(() => {
    const app = new App();
    app.render(MCPInitial);

    portfinder.getPort(
      { port: 3000, stopPort: 9999, host: "127.0.0.1" },
      (err, port) => {
        if (err) {
          console.error(err);
        } else {
          mcp.on("error", (err) => {
            app.render(MCPError({ message: err }));
          });
          (mcp as any).on(
            "request",
            (req: express.Request, res: express.Response) => {
              app.render(MCPRequest({ req, res }));
            }
          );
          mcp.listen(port, (err) => {
            if (err) {
              app.render(MCPError({ message: err }));
            } else {
              app.render(MCPProfile({ url: "http://127.0.0.1", port }));
            }
          });
        }
      }
    );
  });

program.parse();
