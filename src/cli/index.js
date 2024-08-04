#!/usr/bin/env node

import { Command } from "commander";
import inquirer from "inquirer";

import { DEFAULT_FILE_PATH, readFromJSONCredentials } from "../credentials";
import { CredentialError } from "../errors";

const program = new Command();
const credentialOptions = [
  "appId",
  "appSecret",
  "appToken",
  "userToken",
  "userTokenExpires",
  "pageToken",
  "pageTokenExpires",
  "scope",
];

program
  .name("cli-zuckerberg.js")
  .description("The CLI tool for zuckerberg.js and Facebook authentication.");

program
  .command("login")
  .description("Authenticate Facebook credentials.")
  .argument("<string>", "Facebook App ID.")
  .argument("<string>", "Facebook App Secret.")
  .option("--credentials", "Facebook credentials.")
  .option("--path", "Path to the credentials file.")
  .action((appId, appSecret, options) => {
    const credentials =
      options.credentials ||
      readFromJSONCredentials(options.path || DEFAULT_FILE_PATH);

    const emptyCredentials = credentialOptions.filter(
      (option) => !credentials[option]
    );
    emptyCredentials.forEach((option) => {
      switch (option) {
        case "appId":
          credentials.appId = appId;
        case "appSecret":
          credentials.appSecret = appSecret;
        default:
          break;
      }
    });
  });
