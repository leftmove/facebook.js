import { Client, Login } from "../api";
import { CredentialError, PostError } from "../errors";
import type { writeCredentials, readCredentials } from "../credentials";
import type { Permissions } from "../api";

export interface Config {
  appId?: string;
  appSecret?: string;

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
  writeCredentials?: writeCredentials;
  readCredentials?: readCredentials;
  overrideLocal?: boolean;
}

interface PostRegular {
  message: string;
  type?: "user" | "page";
  link?: string;
  published?: boolean;
  targeting?: {
    countries: string[];
    cities: string[];
  };
}

interface PostLink extends Omit<PostRegular, "message"> {
  link: string;
  message?: string;
}

interface PostScheduled extends PostRegular {
  published: boolean;
  scheduled_publish_time: number;
}

interface LinkScheduled extends PostLink {
  published: boolean;
  scheduled_publish_time: number;
}

export class Facebook extends Login {
  client = new Client();

  constructor(config: Config = {}) {
    super(config);
  }

  post(postId: string) {
    try {
      return this.client.get(postId);
    } catch (error) {
      throw new PostError("Error getting post.", error);
    }
  }

  publish(config: PostRegular | PostLink | PostScheduled | LinkScheduled) {
    if (this.userId === undefined) {
      throw new CredentialError("User ID is not defined.");
    }

    if (this.userToken === undefined) {
      throw new CredentialError("User token is not defined.");
    }

    if (this.pageToken === undefined) {
      throw new CredentialError("Page token is not defined.");
    }

    const type = config.type || "page";
    this.refreshPageId(
      this.appId,
      this.appSecret,
      this.userId,
      this.userToken,
      this.pageIndex
    );

    try {
      return this.client.post(`${this.pageId}/feed`, {
        ...config,
        access_token: type === "user" ? this.userToken : this.pageToken,
      });
    } catch (error) {
      throw new PostError("Error publishing post.", error);
    }
  }
}
