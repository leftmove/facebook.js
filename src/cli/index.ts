#!/usr/bin/env bun

import { Command } from "commander";

import Facebook from "../";
import {
  readFromJSONCredentials,
  writeToJSONCredentials,
} from "../credentials";
import { DEFAULT_FILE_PATH, DEFAULT_SCOPE } from "../";
import type { Authentication } from "../";

import {
  appCredentials,
  appTokenCredential,
  userTokenCredential,
  pageTokenCredential,
} from "./token";
import { userIdCredential, pageIdCredential } from "./id";

import { runMCP } from "../mcp";

import { App, LoginStart, RefreshStart, LoginSuccess } from "./components";
import { MCPInitial, MCPClose } from "./components";

const program = new Command();

program
  .name("Facebook.js Command")
  .description("The CLI tool for facebook.js and Facebook authentication.");

const environment = program
  .command("environment")
  .description("Environment commands.");

environment
  .command("view")
  .description("View environment variables.")
  .action(async () => {
    const auth: Authentication = { profile: "page" };
    const facebook = new Facebook(auth);
    await facebook
      .login(auth)
      .then(({ credentials, scope }) => {
        console.log(credentials);
        console.log(scope);
      })
      .catch((e) => {
        console.error(e);
      });
  });

environment
  .command("clear")
  .description("Clear environment variables.")
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

environment
  .command("load")
  .description("Load environment variables.")
  .action(async () => {
    const auth: Authentication = { profile: "page" };
    const facebook = new Facebook(auth);

    const credentials = facebook.readCredentials();
    Object.keys(credentials).forEach((key) => {
      const typedKey = key as keyof typeof credentials;
      if (credentials[typedKey] !== undefined) {
        const envKey = `FACEBOOK-${key
          .replace(/([A-Z])/g, "-$1")
          .toUpperCase()}`;
        const value = JSON.stringify(credentials[typedKey]);
        process.env[envKey] = value;
        console.log(`Set ${envKey}=${value}`);
      }
    });
    console.log("\nFacebook credentials loaded into environment variables.");
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
  .option("--profile", "Profile to run the MCP server for.")
  .action(async (options) => {
    const profile = options.profile || "page";
    const auth: Authentication = { profile };
    const facebook = new Facebook(auth);
    const app = new App();

    await runMCP(facebook, profile)
      .then(() => {
        app.render(MCPInitial);
      })
      .catch((e) => {
        throw e;
      });
  });

program.parse();
