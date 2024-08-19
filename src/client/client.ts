import fs from "fs";
import assert from "node:assert";

import { Client, Login } from "../api";
import { CredentialError, PostError } from "../errors";
import type { writeCredentials, readCredentials } from "../credentials";
import type { Permissions, Info, Access } from "../api";

import { Post } from "./post";

export interface Config {
  id?: string;
  secret?: string;

  access?: Access;
  info?: Info;

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
  path: string | string[];
}

interface MediaScheduled extends Omit<PostScheduled, "message"> {
  message?: string;
  path: string | string[];
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
  getPost(postId: string) {
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
   * @returns A post object with methods for interacting with the post.
   * @throws {CredentialError} If the user ID, user token, or page token is not defined.
   */
  publishPost(
    config: PostRegular | PostLink | PostScheduled | LinkScheduled
  ): Promise<Post> {
    return this.refresh(["pageId", "pageToken"]).then(() => {
      try {
        return this.client
          .post(`${this.info.page.id}/feed`, {
            ...config,
            access_token: this.access.page.token,
          })
          .then((data: { id: string }) => new Post(data.id, this));
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
   * @returns An object with the ID of the post under the 'id' property.
   */
  mediaPost(config: PostMedia | MediaScheduled) {
    return this.refresh(["userToken", "pageId", "pageToken"]).then(() => {
      interface Data {
        id: string;
      }

      const validExtensions = ["jpg", "bmp", "png", "gif", "tiff"];
      const file = (path: string): Promise<Data> => {
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

        assert(this.access.page.token, "Page token is missing."); // Will never throw an error because of above check, but TypeScript doesn't know that
        const form = new FormData();
        const image = fs.readFileSync(path);
        const name = path.split("/").pop();
        const blob = new Blob([image], { type: `image/${extension}}` });

        form.append("access_token", this.access.page.token);
        form.append("source", blob, name);
        form.append("published", "false");
        form.append("temporary", "true");

        return new Promise((resolve) => {
          try {
            resolve(this.client.post(`me/photos`, form, {}));
          } catch (error) {
            throw new PostError("Error uploading photo.", error);
          }
        });
      };

      return Promise.all(
        Array.isArray(config.path)
          ? config.path.map((path) => {
              return file(path);
            })
          : [file(config.path)]
      ).then((images: any) => {
        const options: any = config;
        delete options.url;
        const body = new URLSearchParams({
          ...options,
          access_token: this.access.page.token,
        });
        images.forEach((image: any, i: number) => {
          body.append(
            `attached_media[${i}]`,
            JSON.stringify({ media_fbid: image.id })
          );
        });
        return this.client
          .post(`${this.info.page.id}/feed`, body, {
            "Content-Type": "application/x-www-form-urlencoded",
          })
          .then((data: Data) => new Post(data.id, this));
      });
    });
  }

  /**
   * Edits a post on Facebook.
   * @param postId - The ID of the post to edit.
   * @param message - The new message for the post.
   * @returns Void.
   * @throws {CredentialError} If the user ID, user token, or page token is not defined.
   * @throws {PostError} If there is an error editing the post.
   **/
  editPost({ id, message }: { id: string; message: string }) {
    return this.refresh(["pageId", "pageToken"]).then(() => {
      try {
        return this.client.post(id, {
          message,
          access_token: this.access.page.token,
        });
      } catch (error) {
        throw new PostError("Error editing post.", error);
      }
    });
  }

  /**
   * Deletes a post on Facebook.
   * @param postId - The ID of the post to delete.
   * @returns Void.
   * @throws {CredentialError} If the user ID, user token, or page token is not defined.
   * @throws {PostError} If there is an error deleting the post.
   **/
  removePost({ id }: { id: string }) {
    return this.refresh(["pageToken"]).then(() => {
      try {
        return this.client.post(
          id,
          {
            access_token: this.access.page.token,
          },
          { "Content-Type": "application/json" },
          "DELETE"
        );
      } catch (error) {
        throw new PostError("Error deleting post.", error);
      }
    });
  }

  /**
   * Returns an object with methods for interacting with Facebook posts.
   * @returns An object with methods for interacting with Facebook posts
   **/
  posts = {
    get: this.getPost.bind(this),
    publish: this.publishPost.bind(this),
    upload: this.mediaPost.bind(this),
    edit: this.editPost.bind(this),
    remove: this.removePost.bind(this),
  };

  /**
   * Retrieves a comment by its ID.
   * @param postId - The ID of the post or comment to reply to. If the comment is a reply, this should be the ID of the parent comment.
   * @returns The comment data.
   * @throws {PostError} If there is an error getting the comment.
   **/
  publishComment(postId: string, message: string) {
    return this.refresh(["pageToken"]).then(() => {
      try {
        return this.client.post(postId, {
          message,
          access_token: this.access.page.token,
        });
      } catch (error) {
        throw new PostError("Error publishing comment.", error);
      }
    });
  }

  /**
   * Returns an object with methods for interacting with Facebook comments.
   * @returns An object with methods for interacting with Facebook comments
   **/
  comments() {
    return {};
  }
}
