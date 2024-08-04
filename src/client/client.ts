import { Client, Login } from "../api";
import { CredentialError, GraphError, PostError } from "../errors";
import {
  writeToJSONCredentials,
  readFromJSONCredentials,
} from "../credentials";
import type { writeCredentials, readCredentials } from "../credentials";
import type { Permissions } from "../api";
import type { Credentials } from "../credentials";

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
  link?: string;
  published?: boolean;
  targeting: {
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

  getPost(postId: string) {
    try {
      return this.client.get(postId);
    } catch (error) {
      throw new PostError("Error getting post.", error);
    }
  }

  publishPost(config: PostRegular | PostLink | PostScheduled | LinkScheduled) {
    const post = () =>
      this.client.post(`${this.pageId}/feed}`, {
        ...config,
      });
    try {
      return post();
    } catch {}
  }
}
