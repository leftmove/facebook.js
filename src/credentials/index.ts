import fs from "fs";

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
    if (error.code === "ENOENT") {
      fs.writeFileSync(filePath, JSON.stringify(DEFAULT_CONFIG, null, 2));
    } else {
      throw new FileError("Error reading credentials JSON file", error);
    }
  }
}

export function writeToJSONCredentials(
  credentials: Credentials,
  filePath: string = DEFAULT_FILE_PATH
): void {
  createJSONFileIfNotExists(filePath);

  const oldData = fs.readFileSync(filePath, "utf8");
  const oldJSONCredentials: Credentials = JSON.parse(oldData);
  const oldEnvironmentCredentials: Credentials =
    readFromEnvironmentCredentials();

  const newCredentials: Credentials = Object.assign(
    DEFAULT_CREDENTIAL_TEMPLATE,
    { ...oldEnvironmentCredentials, ...oldJSONCredentials, ...credentials }
  ); // Object.assign orders the keys for readability, not required.
  const data = JSON.stringify(newCredentials, null, 2);
  try {
    fs.writeFileSync(filePath, data, "utf8");
    writeToEnvironmentCredentials(newCredentials);
  } catch (error) {
    throw new FileError("Error writing to credentials JSON file", error);
  }
}

export function readFromJSONCredentials(
  filePath: string = DEFAULT_FILE_PATH
): Credentials {
  createJSONFileIfNotExists(filePath);
  try {
    const data = fs.readFileSync(filePath, "utf8");
    const JSONCredentials: Credentials = JSON.parse(data);
    const environmentCredentials: Credentials =
      readFromEnvironmentCredentials();
    const credentials: Credentials = Object.assign(
      DEFAULT_CREDENTIAL_TEMPLATE,
      { ...environmentCredentials, ...JSONCredentials }
    );
    return credentials;
  } catch (error) {
    throw new FileError("Error reading from credentials JSON file", error);
  }
}

/**
 * Convert a camelCase string to SCREAMING_CASE with a prefix
 * @param key The camelCase string to convert
 * @param prefix The prefix to add to the converted string
 * @returns The converted string in SCREAMING_CASE with prefix
 */
export function toEnvironmentKey(
  key: string,
  prefix: string = "FACEBOOK-"
): string {
  return `${prefix}${key.replace(/([A-Z])/g, "-$1").toUpperCase()}`;
}

/**
 * Convert a SCREAMING_CASE string with a prefix to camelCase
 * @param key The SCREAMING_CASE string with prefix to convert
 * @param prefix The prefix to remove from the string
 * @returns The converted string in camelCase
 */
export function fromEnvironmentKey(
  key: string,
  prefix: string = "FACEBOOK-"
): string {
  if (!key.startsWith(prefix)) {
    return key.toLowerCase();
  }

  // Remove prefix and convert to lowercase
  const withoutPrefix = key.substring(prefix.length).toLowerCase();

  // Convert kebab-case to camelCase
  return withoutPrefix.replace(/-([a-z])/g, (_, letter) =>
    letter.toUpperCase()
  );
}

/**
 * Write credentials to environment variables
 * @param credentials The credentials to write
 * @param prefix The prefix to add to the environment variable names
 */
export function writeToEnvironmentCredentials(
  credentials: Credentials,
  prefix: string = "FACEBOOK-"
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
    throw new CredentialError("Error writing to environment variables", error);
  }
}

/**
 * Read credentials from environment variables
 * @param prefix The prefix of the environment variables to read
 * @returns The credentials read from environment variables
 */
export function readFromEnvironmentCredentials(
  prefix: string = "FACEBOOK-"
): Credentials {
  try {
    const credentials: Credentials = {};

    Object.keys(process.env).forEach((envKey) => {
      if (envKey.startsWith(prefix)) {
        const credentialKey = fromEnvironmentKey(envKey, prefix);
        const typedKey = credentialKey as keyof Credentials;

        try {
          // Parse the JSON value from the environment variable
          const value = process.env[envKey];
          if (value) {
            credentials[typedKey] = JSON.parse(value);
          }
        } catch (parseError) {
          // If parsing fails, use the raw string value
          const value = process.env[envKey];
          if (value) {
            credentials[typedKey] = value as any;
          }
        }
      }
    });

    return credentials;
  } catch (error) {
    throw new CredentialError(
      "Error reading from environment variables",
      error
    );
  }
}
