import fs from "fs";

import { CredentialError } from "../errors";
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
      throw new CredentialError("Error reading credentials JSON file", error);
    }
  }
}

export function writeToJSONCredentials(
  credentials: Credentials,
  filePath: string = DEFAULT_FILE_PATH
): void {
  createJSONFileIfNotExists(filePath);

  const oldData = fs.readFileSync(filePath, "utf8");
  const oldCredentials: Credentials = JSON.parse(oldData);

  const newCredentials: Credentials = Object.assign(
    DEFAULT_CREDENTIAL_TEMPLATE,
    { ...oldCredentials, ...credentials }
  ); // Object.assign orders the keys for readability, not required.
  const data = JSON.stringify(newCredentials, null, 2);
  try {
    fs.writeFileSync(filePath, data, "utf8");
  } catch (error) {
    throw new CredentialError("Error writing to credentials JSON file", error);
  }
}

export function readFromJSONCredentials(
  filePath: string = DEFAULT_FILE_PATH
): Credentials {
  createJSONFileIfNotExists(filePath);
  try {
    const data = fs.readFileSync(filePath, "utf8");
    const credentials: Credentials = JSON.parse(data);
    return credentials;
  } catch (error) {
    throw new CredentialError(
      "Error reading from credentials JSON file",
      error
    );
  }
}
