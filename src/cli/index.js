#!/usr/bin/env node

import { Command } from "commander";
import inquirer from "inquirer";

import Facebook from "../index.ts";

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
  .name("cli-facebook.js")
  .description("The CLI tool for facebook.js and Facebook authentication.");

program
  .command("login")
  .description("Authenticate Facebook credentials.")
  .option("--appId", "Facebook App ID.")
  .option("--appSecret", "Facebook App Secret.")
  .option("--credentials", "Facebook credentials.")
  .option("--path", "Path to the credentials file.")
  .action((options) => {
    const appId = options.appId || null;
    const appSecret = options.appSecret || null;

    if (appId === null || appSecret === null) {
      const questions = [""];
    }
  });
