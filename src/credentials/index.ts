import { promises as fs, access } from "fs";

import { CredentialError } from "../errors";

const DEFAULT_FILE_PATH = "./credentials.json";
const DEFAULT_CONFIG: AuthConfig = {
  appId: "",
  appSecret: "",
};

export interface AuthConfig {
  appId: string;
  appSecret: string;
  userToken?: string | null;
  userTokenExpires?: number | null;
  pageToken?: string | null;
  pageTokenExpires?: number | null;
}

export async function createJSONFileIfNotExists(filePath: string) {
  access(filePath, async (error) => {
    try {
      await fs.writeFile(
        filePath,
        JSON.stringify(DEFAULT_CONFIG, null, 2),
        "utf8"
      );
    } catch {
      throw new CredentialError(
        "Error writing to credentials JSON file",
        error
      );
    }
  });
}

export async function writeToJSONConfig(
  config: AuthConfig,
  filePath: string = DEFAULT_FILE_PATH
) {
  createJSONFileIfNotExists(filePath);

  const oldData = await fs.readFile(filePath, "utf8");
  const oldConfig: AuthConfig = JSON.parse(oldData);

  const newConfig: AuthConfig = { ...oldConfig, ...config };
  const data = JSON.stringify(newConfig, null, 2);
  try {
    await fs.writeFile(filePath, data, "utf8");
  } catch (error) {
    throw new CredentialError("Error writing to credentials JSON file", error);
  }
}

export async function readFromJSONConfig(filePath: string = DEFAULT_FILE_PATH) {
  createJSONFileIfNotExists(filePath);

  try {
    const data = await fs.readFile(filePath, "utf8");
    const config: AuthConfig = JSON.parse(data);
    return config;
  } catch (error) {
    throw new CredentialError(
      "Error reading from credentials JSON file",
      error
    );
  }
}
