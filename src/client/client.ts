import fs from "fs";

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

interface PostMedia extends PostRegular {
  url: string | string[];
}

interface MediaScheduled extends PostScheduled {
  url: string | string[];
}

export class Facebook extends Login {
  client = new Client();

  constructor(config: Config = {}) {
    super(config);
  }

  /**
   * Retrieves a post by its ID.
   * @param postId - The ID of the post to retrieve.
   * @returns The post data.
   * @throws {PostError} If there is an error getting the post.
   */
  post(postId: string) {
    try {
      return this.client.get(postId);
    } catch (error) {
      throw new PostError("Error getting post.", error);
    }
  }

  /**
   * Publishes a post to Facebook.
   * @param config - The configuration object for the post.
   * @param config.message - The caption of the post. This is the default field for a post, and is required if the post is not a link post. It can also be included if the post is a media post.
   * @param config.link - The link of the post, if the post is a link post. Optional, but cannot be used along with a caption.
   * @param config.published - Whether the post is published now or scheduled, true if published now, and false if later. Default is true.
   * @param config.scheduled_publish_time - The time to publish the post, if the post is scheduled. Required if the 'published' is set to true.
   * @param config.targeting - The targeting options for the post, including the audiences the post will target. Optional, find more info [here](https://developers.facebook.com/docs/marketing-api/targeting-specs).
   * @throws {CredentialError} If the user ID, user token, or page token is not defined.
   */
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

    if (this.pageId === undefined) {
      throw new CredentialError("Page ID is not defined.");
    }

    this.refreshPageId(
      this.appId,
      this.appSecret,
      this.userId,
      this.userToken,
      this.pageIndex
    );
    this.refreshPageToken(
      this.appId,
      this.appSecret,
      this.pageId,
      this.userToken
    );

    try {
      return this.client.post(`${this.pageId}/feed`, {
        ...config,
        access_token: this.pageToken,
      });
    } catch (error) {
      throw new PostError("Error publishing post.", error);
    }
  }

  upload(config: PostMedia | MediaScheduled) {
    if (this.userId === undefined) {
      throw new CredentialError("User ID is not defined.");
    }

    if (this.userToken === undefined) {
      throw new CredentialError("User token is not defined.");
    }

    if (this.pageToken === undefined) {
      throw new CredentialError("Page token is not defined.");
    }

    if (this.pageId === undefined) {
      throw new CredentialError("Page ID is not defined.");
    }

    this.refreshPageId(
      this.appId,
      this.appSecret,
      this.userId,
      this.userToken,
      this.pageIndex
    );
    this.refreshPageToken(
      this.appId,
      this.appSecret,
      this.pageId,
      this.userToken
    );

    try {
      interface Data {
        id: string;
      }

      const path = config.url;
      const validExtensions = ["jpeg", "bmp", "png", "gif", "tiff"];

      if (fs.existsSync(path) === false) {
        throw new PostError(
          `File specified at path '${path}' does not exist, cannot upload photo.`
        );
      }

      const extension = path.split(".").pop();
      if (
        extension === undefined ||
        validExtensions.includes(extension) === false
      ) {
        throw new PostError(
          `File specified at path '${path}' is not a supported image. Supported extensions are: ${validExtensions}`
        );
      }

      const body = new FormData();
      body.append("access_token", this.pageToken);
      body.append("source", new Blob([config.url], { type: "image/jpeg" }));

      Object.keys(config).forEach((key: string) => {
        if (key !== "url") {
          body.append(key, (config as any)[key]);
        }
      });

      return this.client.post("me/photos", body).then((data: Data) => {
        try {
          return this.client.post(`${this.pageId}/photos`, {
            ...config,
            access_token: this.pageToken,
          });
        } catch (error) {
          throw new PostError("Error publishing post.", error);
        }
      });
    } catch (error) {
      throw new PostError("Error uploading photos.", error);
    }
  }
}
