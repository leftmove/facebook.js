import fs, { access } from "fs";
import assert from "node:assert";

import { Facebook } from "./client";
import { GraphError, PostError } from "../errors";
import type { Profile } from "../api";

export class Post {
  client: Facebook;

  id: string;
  user: string;

  constructor(id: string, facebook: Facebook) {
    const ids = id.split("_");
    const user = ids[0];
    const post = ids[1];

    this.id = post;
    this.user = user;

    this.client = facebook;
  }

  /**
   * @see {@link Facebook["remove"]}
   * @extends {Facebook["remove"]}
   **/
  remove() {
    return this.client.posts.remove({ id: this.id });
  }

  /**
   * @see {@link Facebook["edit"]}
   * @param message - The new message for the post.
   * @extends {Facebook["edit"]}
   **/
  edit({ message }: { message: string }) {
    return this.client.posts.edit({ id: this.id, message });
  }
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

interface CreatedPost {
  id: string;
}

interface EditPost extends CreatedPost {
  message: string;
}

interface Success {
  success: boolean;
}

// Very unecessary, but less verbose. Nearing on abstraction hell.

function i(profile: Profile, t: Facebook) {
  return profile === "user" ? t.info.user.id : t.info.page.id;
}

function t(profile: Profile, t: Facebook) {
  return profile === "user" ? t.access.user.token : t.access.page.token;
}

/**
 * Retrieves a post by its ID.
 * @param postId - The ID of the post to retrieve.
 * @returns The post data.
 * @throws {PostError} If there is an error getting the post.
 */
export function get(
  this: Facebook,
  config: CreatedPost,
  profile: Profile = this.profile,
) {
  const id = i(profile, this);
  const token = t(profile, this);
  return this.client
    .get(`${id}_${config.id}`, {
      access_token: token,
    })
    .catch((e: GraphError) => {
      throw new PostError("Error getting post.", e);
    });
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
export function publish(
  this: Facebook,
  config: PostRegular | PostLink | PostScheduled | LinkScheduled,
  profile: Profile = this.profile,
): Promise<Post> {
  const id = i(profile, this);
  const token = t(profile, this);
  return this.refresh(["pageId", "pageToken"]).then(() =>
    this.client
      .post(`${id}/feed`, {
        ...config,
        access_token: token,
      })
      .then((data: CreatedPost) => new Post(data.id, this)),
  );
}

/**
 * Publishes a photo post to Facebook.
 * @type {Facebook['publish']}
 * @param config.url - The path of the photo(s) to upload. Can be a single path or an array of paths.
 * @throws {CredentialError} If the user ID, user token, or page token is not defined.
 * @throws {PostError} If there is an error uploading or posting the photos.
 * @returns An object with the ID of the post under the 'id' property.
 */
export function upload(
  this: Facebook,
  config: PostMedia | MediaScheduled,
  profile: Profile = this.profile,
): Promise<CreatedPost> {
  const id = i(profile, this);
  const token = t(profile, this);
  return this.refresh(["userToken", "pageId", "pageToken"]).then(() => {
    interface Data {
      id: string;
    }

    const validExtensions = ["jpg", "bmp", "png", "gif", "tiff"];
    const file = (path: string): Promise<Data> => {
      if (fs.existsSync(path) === false) {
        throw new PostError(
          `File specified at path '${path}' does not exist, cannot upload photo.`,
        );
      }

      const extension = path.split(".").pop();
      if (
        extension === undefined ||
        validExtensions.includes(extension) === false
      ) {
        throw new PostError(
          `File specified at path '${path}' is not a supported image. Supported extensions are: ${validExtensions}`,
        );
      }

      assert(id, "Token is missing."); // Will never throw an error because of above check, but TypeScript doesn't know that
      const form = new FormData();
      const image = fs.readFileSync(path);
      const name = path.split("/").pop();
      const blob = new Blob([image], { type: `image/${extension}}` });

      form.append("access_token", id);
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
        : [file(config.path)],
    ).then((images: any) => {
      const options: any = config;
      delete options.url;
      const body = new URLSearchParams({
        ...options,
        access_token: token,
      });
      images.forEach((image: any, i: number) => {
        body.append(
          `attached_media[${i}]`,
          JSON.stringify({ media_fbid: image.id }),
        );
      });
      return this.client
        .post(`${id}/feed`, body, {
          "Content-Type": "application/x-www-form-urlencoded",
        })
        .then((data: CreatedPost) => new Post(data.id, this));
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
export function edit(
  this: Facebook,
  config: EditPost,
  profile: Profile = this.profile,
): Promise<Success> {
  const id = i(profile, this);
  const token = t(profile, this);
  return this.refresh(["pageId", "pageToken"]).then(() =>
    this.client.post(`${id}_${config.id}`, {
      message: config.message,
      access_token: token,
    }),
  );
}

/**
 * Deletes a post on Facebook.
 * @param postId - The ID of the post to delete.
 * @returns Void.
 * @throws {CredentialError} If the user ID, user token, or page token is not defined.
 * @throws {PostError} If there is an error deleting the post.
 **/
export function remove(
  this: Facebook,
  config: CreatedPost,
  profile: Profile = this.profile,
) {
  const id = i(profile, this);
  const token = t(profile, this);
  return this.refresh(["userId", "pageToken"]).then(() =>
    this.client.post(
      `${id}_${config.id}`,
      {
        access_token: token,
      },
      { "Content-Type": "application/json" },
      "DELETE",
    ),
  );
}

export function posts(t: Facebook) {
  return {
    get: get.bind(t),
    publish: publish.bind(t),
    upload: upload.bind(t),
    edit: edit.bind(t),
    remove: remove.bind(t),
  };
}

export function uposts(t: Facebook) {
  return {
    get: t.switch("user").posts.get.bind(t),
    publish: t.switch("user").posts.publish.bind(t),
    upload: t.switch("user").posts.upload.bind(t),
    edit: t.switch("user").posts.edit.bind(t),
    remove: t.switch("user").posts.remove.bind(t),
  };
}

export function pposts(t: Facebook) {
  return {
    get: t.switch("page").posts.get.bind(t),
    publish: t.switch("page").posts.publish.bind(t),
    upload: t.switch("page").posts.upload.bind(t),
    edit: t.switch("page").posts.edit.bind(t),
    remove: t.switch("page").posts.remove.bind(t),
  };
}
