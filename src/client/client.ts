import fs from "fs";
import assert from "node:assert";

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

interface PostMedia extends Omit<PostRegular, "message"> {
  message?: string;
  type?: "path" | "url" | "media";
  url?: string | string[];
  path?: string | string[];
  media?: string | string[];
}

interface MediaScheduled extends Omit<PostScheduled, "message"> {
  message?: string;
  type?: "path" | "url" | "media";
  url?: string | string[];
  path?: string | string[];
  media?: string | string[];
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
   * @returns An object with the ID of the post under the 'id' property.
   * @throws {CredentialError} If the user ID, user token, or page token is not defined.
   */
  publish(config: PostRegular | PostLink | PostScheduled | LinkScheduled) {
    return this.refresh(["pageId", "pageToken"]).then(() => {
      try {
        return this.client.post(`${this.pageId}/feed`, {
          ...config,
          access_token: this.pageToken,
        });
      } catch (error) {
        throw new PostError("Error publishing post.", error);
      }
    });
  }

  /**
   * Publishes a photo post to Facebook.
   * @type {Facebook['publish']}
   * @param config.url - The path of the photo(s) to upload. Can be a single path or an array of paths.
   * @throws {CredentialError} If the user ID, user token, or page token is not defined.
   * @throws {PostError} If there is an error uploading or posting the photos.
   * @returns An object with the ID of the post under the 'id' property, and the images IDs under the 'images' property.
   */
  upload(config: PostMedia | MediaScheduled) {
    return this.refresh(["userToken", "pageId", "pageToken"]).then(() => {
      interface Data {
        id: string;
      }

      const validExtensions = ["jpg", "bmp", "png", "gif", "tiff"];
      const store = (...args: any[]): Promise<Data> => {
        return new Promise((resolve) => {
          try {
            const form = new FormData();

            assert(this.pageToken, "Page token is missing."); // Will never throw an error because of above check, but TypeScript doesn't know that

            form.append("access_token", this.pageToken);
            form.append("published", "false");
            form.append("temporary", "true");
            form.append(...args);

            resolve(
              this.client.post(`me/photos`, form, {
                "Content-Type": "multipart/form-data",
              })
            );
          } catch (error) {
            throw new PostError("Error uploading photo.", error);
          }
        });
      };
      const file = (path: string) => {
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

        assert(this.pageToken, "Page token is missing."); // Will never throw an error because of above check, but TypeScript doesn't know that
        const form = new FormData();
        const image = fs.readFileSync(path);
        const name = path.split("/").pop();
        const blob = new Blob([image], { type: `image/${extension}}` });

        form.append("access_token", this.pageToken);
        form.append("source", blob, name);
        form.append("published", "false");
        form.append("temporary", "true");

        return store(form);
      };
      const url = (href: string) => {
        const valid = new RegExp(/^(http|https):\/\/[^ "]+$/);
        if (valid.test(href) === false) {
          throw new PostError(
            `URL specified at '${href}' is not a valid URL, cannot upload photo.`
          );
        }
        return store(href)
      };

      const promises = [];
      const type = config.type || "path";
      
      let urls = config[type] as string | string[];
      if (Array.isArray(urls) === false) {
        urls = [urls];
      }

      urls.forEach((url) => {
        switch (type) {
          case "path":
            promises.push(file(url));
            break;
          case "url":
            promises.push(url(url));
            break;
        }


      return Promise.all(
        Array.isArray(config.url)
          ? config.url.map((url) => {
              return file(url);
            })
          : [file(config.url)]
      ).then((images: any) => {
        const options: any = config;
        delete options.url;
        const body = new URLSearchParams({
          ...options,
          access_token: this.pageToken,
        });
        images.forEach((image: any, i: number) => {
          body.append(
            `attached_media[${i}]`,
            JSON.stringify({ media_fbid: image.id })
          );
        });
        return this.client.post(`${this.pageId}/feed`, body, {
          "Content-Type": "application/x-www-form-urlencoded",
        });
      });
    });
  }
}
