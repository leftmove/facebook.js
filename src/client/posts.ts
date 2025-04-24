import fs, { access } from "fs";
import assert from "node:assert";

import { Facebook } from "./client";
import { DeprecatedError, PostError } from "../errors";
import type { Profile } from "../api";

/**
/**
 * A post object with methods for interacting with the post.
 * 
 * @property {string} id - The unique identifier for the post.
 * @property {string} user - The ID of the user who created the post.
 * @property {Date} [created_at] - The date and time when the post was created. Note that when this is returned from the {@link Posts#publish} method, it is automatically set to the current date and time, which is not the way Facebook (or any of the other methods) returns the property.
 * @property {string} [message] - The content of the post.
 * @property {boolean} [success] - Whether the action which was performed on the post was successful.
 */
export class Post {
  private client: Facebook;

  id: string;
  user?: string;

  created_at?: Date;
  message?: string;

  success?: boolean;

  constructor(post: CreatedPost, facebook: Facebook) {
    if (post.id === undefined) {
      throw new PostError("Post ID is required.");
    }

    const ids = post.id.split("_");
    const userID = ids.length > 1 ? ids[0] : undefined;
    const postID = ids.length > 1 ? ids[1] : ids[0];

    this.id = postID;
    this.user = userID;

    this.created_at = post.created_time
      ? new Date(post.created_time)
      : undefined;
    this.message = post.message || undefined;
    this.success = post.success || undefined;

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

interface PostScheduled extends PostRegular {
  published: boolean;
  scheduled_publish_time: number;
}

interface PostLink extends Omit<PostRegular, "message"> {
  link: string;
  message?: string;
}

interface PostLinkScheduled extends PostLink {
  published: boolean;
  scheduled_publish_time: number;
}

interface PostMedia extends Omit<PostRegular, "message"> {
  message?: string;
  path: string | string[];
}

interface PostMediaScheduled extends Omit<PostScheduled, "message"> {
  message?: string;
  path: string | string[];
  published: boolean;
  scheduled_publish_time: number;
}

interface PostMediaLink extends Omit<PostRegular, "message"> {
  message?: string;
  url: string | string[];
}

interface PostMediaLinkScheduled extends PostMediaLink {
  published: boolean;
  scheduled_publish_time: number;
}

type id = string;
interface CreatedPost {
  id?: id;
  message?: string;
  created_time?: string;
  success?: boolean;
}

interface EditPost extends CreatedPost {
  message: string;
}

interface Success {
  success: boolean;
}

// Very unnecessary, but less verbose. Nearing on abstraction hell.

function i(profile: Profile, t: Facebook) {
  return profile === "user" ? t.info.user.id : t.info.page.id;
}

function t(profile: Profile, t: Facebook) {
  return profile === "user" ? t.access.user.token : t.access.page.token;
}

export class Posts {
  constructor(public facebook: Facebook) {}

  /**
   * Retrieves a post by its ID.
   * @param config - The post ID, or a post object.
   * @returns {Post} A post object with methods for interacting with the post.
   * @throws {PostError} If there is an error getting the post.
   */
  async get(
    config: CreatedPost | Post | id,
    profile: Profile = this.facebook.profile,
    credentials: string[] = profile === "page"
      ? ["pageId", "pageToken"]
      : ["userId", "userToken"],
    permissions: string[] = profile === "page"
      ? ["pages_read_engagement", "pages_manage_posts"]
      : []
  ): Promise<Post> {
    return this.facebook.refresh(credentials, permissions).then(() => {
      const id = i(profile, this.facebook);
      const token = t(profile, this.facebook);

      if (typeof config === "string") {
        config = { id: config };
      }

      return this.facebook.client
        .get(`${id}_${config.id}`, {
          access_token: token,
        })
        .then((data: CreatedPost) => new Post(data, this.facebook))
        .catch((e: PostError) => {
          throw e;
        });
    });
  }

  /**
   * Reads all posts from the profile.
   * @returns {Post[]} An array of post objects.
   * @throws {PostError} If there is an error getting the posts.
   */
  async read(
    profile: Profile = this.facebook.profile,
    credentials: string[] = profile === "page"
      ? ["pageId", "pageToken"]
      : ["userId", "userToken"],
    permissions: string[] = profile === "page"
      ? ["pages_read_engagement", "pages_manage_posts"]
      : []
  ): Promise<Post[]> {
    return this.facebook.refresh(credentials, permissions).then(async () => {
      const id = i(profile, this.facebook);
      const token = t(profile, this.facebook);

      return this.facebook.client
        .get(`${id}/posts`, {
          access_token: token,
        })
        .then((posts: { data: CreatedPost[] }) => {
          return posts.data.map((post) => new Post(post, this.facebook));
        });
    });
  }

  /**
   * Publishes a post to Facebook.
   * @param config - The configuration object for the post.
   * @param config.message - The caption of the post.
   * @param config.link - The link of the post, if the post is a link post.
   * @param config.published - Whether the post is published now or scheduled.
   * @param config.scheduled_publish_time - The time to publish the post, if scheduled.
   * @param config.targeting - The targeting options for the post.
   * @returns A post object with methods for interacting with the post. Note that the `created_at` property is automatically set to the current date and time, this is not the way Facebook (or any of the other methods) returns it.
   */
  async publish(
    config: PostRegular | PostLink | PostScheduled | PostLinkScheduled,
    profile: Profile = this.facebook.profile,
    credentials: string[] = profile === "page"
      ? ["pageId", "pageToken"]
      : ["userId", "userToken"],
    permissions: string[] = profile === "page"
      ? ["pages_read_engagement", "pages_manage_posts"]
      : []
  ): Promise<Post> {
    return this.facebook.refresh(credentials, permissions).then(() => {
      const id = i(profile, this.facebook);
      const token = t(profile, this.facebook);

      return this.facebook.client
        .post(`${id}/feed`, {
          ...config,
          access_token: token,
        })
        .then(
          (data: CreatedPost) =>
            new Post(
              {
                created_time: data.created_time || new Date().toISOString(),
                message: data.message || config.message || undefined,
                success: true,
                ...data,
              },
              this.facebook
            )
        );
    });
  }

  /**
   * Publishes a media post to Facebook. For more information on uploading media as posts, see the [Facebook Graph API documentation](https://developers.facebook.com/docs/pages-api/posts/#publish-media-posts).
   * @param config - The configuration object for the photo post.
   * @param config.path - The path of the photo(s) to upload.
   * @param config.url - The URL of the photo(s) to upload.
   * @returns A post object with methods for interacting with the post.
   */
  async upload(
    config:
      | PostMedia
      | PostMediaScheduled
      | PostMediaLink
      | PostMediaLinkScheduled,
    profile: Profile = this.facebook.profile,
    credentials: string[] = profile === "page"
      ? ["pageId", "pageToken"]
      : ["userId", "userToken"],
    permissions: string[] = profile === "page"
      ? ["pages_read_engagement", "pages_manage_posts"]
      : []
  ): Promise<Post> {
    return this.facebook.refresh(credentials, permissions).then(async () => {
      const id = i(profile, this.facebook);
      const token = t(profile, this.facebook);
      let imagePromises;

      if ("path" in config) {
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

          const form = new FormData();
          const image = fs.readFileSync(path);
          const name = path.split("/").pop();
          const blob = new Blob([image], { type: `image/${extension}}` });
          assert(token, "Token is missing.");

          form.append("access_token", token);
          form.append("source", blob, name);
          form.append("published", "false");
          form.append("temporary", "true");

          return new Promise((resolve) => {
            try {
              resolve(
                this.facebook.client
                  .post(`me/photos`, form, {})
                  .then((data: Data) => data)
              );
            } catch (error) {
              throw new PostError("Error uploading photo.", error);
            }
          });
        };
        imagePromises = Array.isArray(config.path)
          ? config.path.map((path) => {
              return file(path);
            })
          : [file(config.path)];
      } else if ("url" in config) {
        imagePromises = Array.isArray(config.url)
          ? config.url.map((url) => {
              return {
                id: url,
              };
            })
          : [{ id: config.url }];
      }

      assert(imagePromises, "Invalid config.");

      return Promise.all(imagePromises)
        .catch((e: PostError) => {
          throw new PostError("Error uploading media.", e);
        })
        .then((images: { id: string }[]) => {
          const body = new URLSearchParams();
          body.append("message", config.message || "");
          body.append("access_token", token!);
          // body.append("published", "true");
          images.forEach((image: { id: string }, i) => {
            body.append(
              `attached_media[${i}]`,
              `{"media_fbid": "${image.id}"}`
            );
          });

          return this.facebook.client
            .post(`me/feed`, body, {
              "Content-Type": "application/x-www-form-urlencoded",
            })
            .then((data: CreatedPost) => new Post(data, this.facebook))
            .catch((e: PostError) => {
              throw e;
            });
        });
    });
  }

  /**
   * Edits a post on Facebook.
   * @param config - The configuration object for editing the post.
   * @param config.id - The ID of the post to edit.
   * @param config.message - The new message for the post.
   * @returns Success status.
   */
  async edit(
    config: EditPost,
    profile: Profile = this.facebook.profile,
    credentials: string[] = profile === "page"
      ? ["pageId", "pageToken"]
      : ["userId", "userToken"],
    permissions: string[] = profile === "page"
      ? ["pages_read_engagement", "pages_manage_posts"]
      : []
  ): Promise<Post> {
    return this.facebook.refresh(credentials, permissions).then(() => {
      const id = i(profile, this.facebook);
      const token = t(profile, this.facebook);
      return this.facebook.client
        .post(`${id}_${config.id}`, {
          message: config.message,
          access_token: token,
        })
        .then((data: Success) => {
          if (data.success === false) {
            throw new PostError("Failed to edit post.");
          }
          return new Post(
            {
              id: config.id,
              message: config.message,
              ...data,
              success: true,
            },
            this.facebook
          );
        });
    });
  }

  /**
   * Deletes a post on Facebook.
   * @param config - The configuration object for deleting the post.
   * @param config.id - The ID of the post to delete.
   * @returns Success status.
   */
  async remove(
    config: CreatedPost | id,
    profile: Profile = this.facebook.profile,
    credentials: string[] = profile === "page"
      ? ["pageId", "pageToken"]
      : ["userId", "userToken"],
    permissions: string[] = profile === "page"
      ? ["pages_read_engagement", "pages_manage_posts"]
      : []
  ): Promise<Post> {
    return this.facebook.refresh(credentials, permissions).then(() => {
      const id = i(profile, this.facebook);
      const token = t(profile, this.facebook);

      if (typeof config === "string") {
        config = { id: config };
      }

      return this.facebook.client
        .post(
          `${id}_${config.id}`,
          {
            access_token: token,
          },
          { "Content-Type": "application/json" },
          "DELETE"
        )
        .then((data: Success) => {
          return new Post(
            {
              // @ts-ignore TypeScript is stupid.
              id: config.id,
              success: data.success,
            },
            this.facebook
          );
        });
    });
  }
}

/**
 * Class for managing posts on a Facebook user profile.
 * Provides methods for getting posts.
 * Since April of 2018, Facebook has disabled the ability to publish, edit, and delete posts from a user's profile.
 * You can read more about on the @link{https://developers.facebook.com/ads/blog/post/v2/2018/04/24/platform-product-changes accompanying blog post}, and the @link{https://developers.facebook.com/docs/graph-api/changelog/breaking-changes/ breaking changes changelog}.
 */
export class UserPosts extends Posts {
  constructor(facebook: Facebook) {
    super(facebook);
  }

  /**
   * Retrieves a post by its ID from the user's profile.
   * @param config - The configuration object containing the post ID.
   * @param config.id - The ID of the post to retrieve.
   * @returns The post data.
   * @throws {PostError} If there is an error getting the post.
   */
  async get(config: CreatedPost) {
    return super.get(config, "user", ["userId", "userToken"], []);
  }

  /**
   * Reads all posts from the profile. Usually not accessible since it requires the `user_posts` permission, which requires special approval from Facebook.
   * @returns User post history.
   * @throws {PostError} If there is an error getting the posts.
   */
  async read(): Promise<Post[]> {
    return super.read("user", ["userId", "userToken"], []);
  }

  /**
   * @description This method is deprecated since Facebook disabled the ability to publish posts from user profiles. Try publishing from a page profile instead. For more information, see the links below.
   * @deprecated
   * @throws {DeprecatedError} If the method is called.
   * @see {@link PagePosts#publish}
   * @see {@link https://developers.facebook.com/docs/graph-api/changelog/breaking-changes/}
   * @see {@link https://developers.facebook.com/ads/blog/post/v2/2018/04/24/platform-product-changes}
   */
  async publish() {
    throw new DeprecatedError(
      "Publishing posts from user profiles is no longer supported. Please post from page profiles instead.\n" +
        "For more information, visit:\n" +
        "https://developers.facebook.com/ads/blog/post/v2/2018/04/24/platform-product-changes\n" +
        "https://developers.facebook.com/docs/graph-api/changelog/breaking-changes/"
    );
    return super.publish({ message: "" }, "user", ["userId", "userToken"], []);
  }

  /**
   * @description This method is deprecated since Facebook disabled the ability to upload media from user profiles. Try uploading from a page profile instead. For more information, see the links below.
   * @deprecated
   * @throws {DeprecatedError} If the method is called.
   * @see {@link PagePosts#upload}
   * @see {@link https://developers.facebook.com/docs/graph-api/changelog/breaking-changes/}
   * @see {@link https://developers.facebook.com/ads/blog/post/v2/2018/04/24/platform-product-changes}
   */
  async upload() {
    throw new DeprecatedError(
      "Uploading media from user profiles is no longer supported. Please upload from page profiles instead.\n" +
        "For more information, visit:\n" +
        "https://developers.facebook.com/ads/blog/post/v2/2018/04/24/platform-product-changes\n" +
        "https://developers.facebook.com/docs/graph-api/changelog/breaking-changes/"
    );
    return super.upload({ path: "" }, "user", ["userId", "userToken"], []);
  }

  /**
   * @description This method is deprecated since Facebook disabled the ability to edit posts from user profiles. Try editing from a page profile instead. For more information, see the links below.
   * @deprecated
   * @throws {DeprecatedError} If the method is called.
   * @see {@link PagePosts#edit}
   * @see {@link https://developers.facebook.com/docs/graph-api/changelog/breaking-changes/}
   * @see {@link https://developers.facebook.com/ads/blog/post/v2/2018/04/24/platform-product-changes}
   */
  async edit() {
    throw new DeprecatedError(
      "Editing posts from user profiles is no longer supported. Please edit from page profiles instead.\n" +
        "For more information, visit:\n" +
        "https://developers.facebook.com/ads/blog/post/v2/2018/04/24/platform-product-changes\n" +
        "https://developers.facebook.com/docs/graph-api/changelog/breaking-changes/"
    );
    return super.edit(
      { id: "", message: "" },
      "user",
      ["userId", "userToken"],
      []
    );
  }

  /**
   * @description This method is deprecated since Facebook disabled the ability to delete posts from user profiles. Try deleting from a page profile instead. For more information, see the links below.
   * @deprecated
   * @throws {DeprecatedError} If the method is called.
   * @see {@link PagePosts#remove}
   * @see {@link https://developers.facebook.com/docs/graph-api/changelog/breaking-changes/}
   * @see {@link https://developers.facebook.com/ads/blog/post/v2/2018/04/24/platform-product-changes}
   */
  async remove() {
    throw new DeprecatedError(
      "Deleting posts from user profiles is no longer supported. Please delete from page profiles instead.\n" +
        "For more information, visit:\n" +
        "https://developers.facebook.com/ads/blog/post/v2/2018/04/24/platform-product-changes\n" +
        "https://developers.facebook.com/docs/graph-api/changelog/breaking-changes/"
    );
    return super.remove({ id: "" }, "user", ["userId", "userToken"], []);
  }
}

/**
 * Class for managing posts on a Facebook page.
 * Provides methods for creating, reading, updating and deleting posts.
 */
export class PagePosts extends Posts {
  constructor(facebook: Facebook) {
    super(facebook);
  }

  /**
   * Retrieves a post by its ID from the page.
   * @param config - The configuration object containing the post ID.
   * @param config.id - The ID of the post to retrieve.
   * @returns The post data.
   * @throws {PostError} If there is an error getting the post.
   */
  async get(config: CreatedPost) {
    return super.get(
      config,
      "page",
      ["pageId", "pageToken"],
      ["pages_read_engagement", "pages_manage_posts"]
    );
  }

  /**
   * Reads all posts from the page.
   * @returns Page post history.
   * @throws {PostError} If there is an error getting the posts.
   */
  async read(): Promise<Post[]> {
    return super.read(
      "page",
      ["pageId", "pageToken"],
      ["pages_read_engagement", "pages_manage_posts"]
    );
  }

  /**
   * Publishes a post to the page.
   * @param config - The configuration object for the post.
   * @param config.message - The caption of the post.
   * @param config.link - The link of the post, if the post is a link post.
   * @param config.published - Whether the post is published now or scheduled.
   * @param config.scheduled_publish_time - The time to publish the post, if scheduled.
   * @param config.targeting - The targeting options for the post.
   * @returns {Post} A post object with methods for interacting with the post.
   */
  async publish(
    config: PostRegular | PostLink | PostScheduled | PostLinkScheduled
  ) {
    return super.publish(
      config,
      "page",
      ["pageId", "pageToken"],
      ["pages_read_engagement", "pages_manage_posts"]
    );
  }

  /**
   * Publishes a media post to the page.
   * @param config - The configuration object for the media post.
   * @param config.path - The path of the media file(s) to upload.
   * @param config.url - The URL of the media file(s) to upload.
   * @returns {Post} A post object with methods for interacting with the post.
   */
  async upload(
    config:
      | PostMedia
      | PostMediaScheduled
      | PostMediaLink
      | PostMediaLinkScheduled
  ) {
    return super.upload(
      config,
      "page",
      ["pageId", "userToken"],
      ["pages_read_engagement", "pages_manage_posts"]
    );
  }

  /**
   * Edits a post on the page.
   * @param config - The configuration object for editing the post.
   * @param config.id - The ID of the post to edit.
   * @param config.message - The new message for the post.
   * @returns {Post} A post object with methods for interacting with the post.
   */
  async edit(config: EditPost) {
    return super.edit(
      config,
      "page",
      ["pageId", "pageToken"],
      ["pages_read_engagement", "pages_manage_posts"]
    );
  }

  /**
   * Deletes a post from the page.
   * @param config - The configuration object for deleting the post.
   * @param config.id - The ID of the post to delete.
   * @returns {Post} A post object with methods for interacting with the post.
   */
  async remove(config: CreatedPost) {
    return super.remove(
      config,
      "page",
      ["pageId", "pageToken"],
      ["pages_read_engagement", "pages_manage_posts"]
    );
  }
}
