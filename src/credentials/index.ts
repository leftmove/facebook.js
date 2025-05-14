import fs from "fs";
import envPaths from "env-paths";
import dotenv from "dotenv";

import { CredentialError, FileError } from "../errors";
import type { Permissions, Profile } from "../api";

export interface Credentials {
  appId?: string;
  appSecret?: string;
  profile?: Profile;
  appToken?: string;
  appTokenExpires?: number;
  userToken?: string;
  userId?: string;
  userIdExpires?: number;
  userTokenExpires?: number;
  pageId?: string;
  pageIdExpires?: number;
  pageIndex?: number;
  pageToken?: string;
  pageTokenExpires?: number;
  scope?: Permissions;
}

export const DEFAULT_CONFIG_PATH = `${
  envPaths("facebook").config
}/credentials.json`;
export const DEFAULT_FILE_PATH = "./credentials.json";
export const DEFAULT_CONFIG: Credentials = {
  appId: undefined,
  appSecret: undefined,
};
export const DEFAULT_CREDENTIAL_TEMPLATE: Credentials = {
  appId: undefined,
  appSecret: undefined,
  profile: undefined,
  appToken: undefined,
  appTokenExpires: undefined,
  userToken: undefined,
  userId: undefined,
  userIdExpires: undefined,
  userTokenExpires: undefined,
  pageId: undefined,
  pageIdExpires: undefined,
  pageIndex: undefined,
  pageToken: undefined,
  pageTokenExpires: undefined,
};

export type writeCredentials = (credentials: Credentials) => void;
export type readCredentials = () => Credentials;

export function createJSONFileIfNotExists(filePath: string) {
  try {
    fs.readFileSync(filePath, "utf8");
  } catch (error: any) {
    if (error.code === "ENOENT" || error.code === "ENOTDIR") {
      try {
        const directory = filePath.split("/").slice(0, -1).join("/");
        try {
          const stats = fs.statSync(directory);
          if (!stats.isDirectory()) {
            fs.unlinkSync(directory);
            fs.mkdirSync(directory, { recursive: true });
          }
        } catch (statError: any) {
          if (statError.code === "ENOENT") {
            fs.mkdirSync(directory, { recursive: true });
          } else {
            throw statError;
          }
        }
        fs.writeFileSync(filePath, JSON.stringify(DEFAULT_CONFIG, null, 2));
      } catch (dirError) {
        throw new FileError(
          "Error creating directory structure for credentials file",
          dirError
        );
      }
    } else {
      throw new FileError("Error reading credentials from JSON file", error);
    }
  }
}

export function doesFileExist(filePath: string): boolean {
  try {
    fs.readFileSync(filePath, "utf8");
    return true;
  } catch (error: any) {
    return false;
  }
}

// These are called read/write from "JSON" credentials, but really they are just default reads/writes.
// They use JSON, but they have some other functionality that's useful more than that.

export function writeToJSONCredentials(
  credentials: Credentials,
  filePath: string = DEFAULT_FILE_PATH
): void {
  // The following code covers three conditions. It's a little all over the place so here's some extensive documentation to explain what's going on.

  // 1. Current directory credentials exist
  // In this situation, the inputted credentials combine (and override) the current directory credentials, and the resulting credentials are written to both the current directory and the config directory.
  // 2. Current directory credentials do not exist, but config directory credentials do.
  // In this situation, the inputted credentials combine (and override) the config directory credentials, and the resulting credentials are written to only the config directory.
  // 3. Neither the current directory nor the config directory credentials exist.
  // In this situation, the inputted credentials, templated to the default credential template, are written to both the current directory and the config directory.

  if (
    doesFileExist(filePath) // Do the current directory credentials exist? Condition 1.
  ) {
    createJSONFileIfNotExists(DEFAULT_CONFIG_PATH);

    const currentDirectoryCredentials: Credentials = JSON.parse(
      fs.readFileSync(filePath, "utf8")
    );
    credentials = Object.assign(DEFAULT_CREDENTIAL_TEMPLATE, {
      // New credentials are current directory credentials updated with inputted credentials
      ...currentDirectoryCredentials,
      ...credentials,
    });
  } else if (
    doesFileExist(filePath) === false && // Current directory credential file doesn't exist;
    doesFileExist(DEFAULT_CONFIG_PATH) === true // but config directory one does. Condition 2.
  ) {
    const configDirectoryCredentials: Credentials = JSON.parse(
      fs.readFileSync(DEFAULT_CONFIG_PATH, "utf8")
    );
    credentials = Object.assign(DEFAULT_CREDENTIAL_TEMPLATE, {
      // New credentials are config directory credentials updated with inputted credentials
      ...configDirectoryCredentials,
      ...credentials,
    });
  } else if (
    doesFileExist(filePath) === false && // Are there no credentials that exist locally?
    doesFileExist(DEFAULT_CONFIG_PATH) === false // Condition 3.
  ) {
    // The following two lines are half redundant since it's known that these files don't exist. This function is only used for convenience as it creates a file, which is what we really need to do in order to trigger the final conditionals below.
    createJSONFileIfNotExists(filePath);
    createJSONFileIfNotExists(DEFAULT_CONFIG_PATH);

    credentials = Object.assign(DEFAULT_CREDENTIAL_TEMPLATE, credentials);
  }

  // Write the credentials to the current directory and config directory, if they exist.
  if (doesFileExist(filePath) === true) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(credentials, null, 2));
    } catch (error) {
      throw new FileError(
        "Error writing to credentials file in current directory.",
        error
      );
    }
  }
  if (doesFileExist(DEFAULT_CONFIG_PATH) === true) {
    try {
      fs.writeFileSync(
        DEFAULT_CONFIG_PATH,
        JSON.stringify(credentials, null, 2)
      );
    } catch (error) {
      throw new FileError(
        "Error writing to credentials file in config directory.",
        error
      );
    }
    writeToEnvironmentCredentials(credentials);
  }
}

export function readFromJSONCredentials(
  filePath: string = DEFAULT_FILE_PATH
): Credentials {
  try {
    const environmentCredentials = readFromEnvironmentCredentials();
    const configCredentials: Credentials = doesFileExist(DEFAULT_CONFIG_PATH)
      ? JSON.parse(fs.readFileSync(DEFAULT_CONFIG_PATH, "utf8"))
      : {};
    const JSONCredentials: Credentials = doesFileExist(filePath)
      ? JSON.parse(fs.readFileSync(filePath, "utf8"))
      : {};

    // Order of precedence: current directory, config directory, environment
    const credentials: Credentials = Object.assign(
      DEFAULT_CREDENTIAL_TEMPLATE,
      { ...configCredentials, ...environmentCredentials, ...JSONCredentials }
    );
    return credentials;
  } catch (error) {
    throw new FileError("Error reading from credentials JSON file", error);
  }
}

export function toEnvironmentKey(
  key: string,
  prefix: string = "FACEBOOK_"
): string {
  return `${prefix}${key.replace(/([A-Z])/g, "_$1").toUpperCase()}`;
}

export function fromEnvironmentKey(
  key: string,
  prefix: string = "FACEBOOK_"
): string {
  if (key.startsWith(prefix) === false) {
    return key;
  } else {
    return key // SCREAMING_CASE to camelCase from key without prefix.
      .substring(prefix.length)
      .toLowerCase()
      .replace(/_([a-z])/g, (_, c) => c.toUpperCase());
  }
}

/**
 * Write credentials to environment variables
 * @param credentials The credentials to write
 * @param prefix The prefix to add to the environment variable names
 */
export function writeToEnvironmentCredentials(
  credentials: Credentials,
  prefix: string = "FACEBOOK_"
): void {
  try {
    Object.keys(credentials).forEach((key) => {
      const typedKey = key as keyof typeof credentials;
      if (credentials[typedKey] !== undefined) {
        const envKey = toEnvironmentKey(key, prefix);
        const value = JSON.stringify(credentials[typedKey]);
        process.env[envKey] = value;
      }
    });
  } catch (error) {
    throw new FileError("Error writing to environment variables", error);
  }
}

/**
 * Read credentials from environment variables
 * @param prefix The prefix of the environment variables to read
 * @returns The credentials read from environment variables
 */
export function readFromEnvironmentCredentials(): Credentials {
  try {
    dotenv.config();
    const credentials: Credentials = {};
    const credentialKeys = Object.keys(DEFAULT_CREDENTIAL_TEMPLATE);

    credentialKeys
      .map((key) => toEnvironmentKey(key))
      .forEach((key, i) => {
        const envKey = key;
        const credKey = credentialKeys[i] as keyof Credentials;

        if (key in process.env) {
          credentials[credKey] = JSON.parse(
            JSON.stringify(process.env[envKey])
          ) as any;
        } else {
          credentials[credKey] = DEFAULT_CREDENTIAL_TEMPLATE[credKey] as any;
        }
      });

    return credentials;
  } catch (error) {
    throw new FileError("Error reading from environment variables", error);
  }
}
