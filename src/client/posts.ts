import fs from "fs";
import assert from "node:assert";

import { Facebook, i, t } from "./client";
import { DeprecatedError, PostError, warnConsole } from "../errors";
import { stringify } from "../api";
import { FACEBOOK_URL } from "../api";
import type { Profile } from "../api";

type id = string;
export interface CreatedPost {
  id?: id;
  message?: string;
  created_time?: string;
  success?: boolean;
  scheduled?: boolean;
}

export interface EditPost extends CreatedPost {
  id: string;
  message: string;
}

export interface EditPostEmbedded extends Omit<EditPost, "id"> {
  id?: string;
}

export interface RemovePost extends CreatedPost {
  id: string;
}
export interface RemovePostEmbedded extends Omit<RemovePost, "id"> {
  // Completely useless but it's here for the sake of completeness/consistency.
  id?: string;
}

export interface Success {
  success: boolean;
}

export interface Targeting {
  [key: string]: any;
  targeting: {
    geo_locations: {
      countries: Array<string>;
      cities: Array<{
        key: string;
        name: string;
      }>;
    };
  };
}

export interface PostRegular {
  message: string;
  targeting?: Targeting;
}

export interface PostScheduled extends PostRegular {
  schedule: string | Date;
  bypass?: boolean;
}

export interface PostLink extends Omit<PostRegular, "message"> {
  link: string;
  message?: string;
}

export interface PostLinkScheduled extends PostLink {
  schedule: string | Date;
  bypass?: boolean;
}

export interface PostMedia extends Omit<PostRegular, "message"> {
  message?: string;
  media: string | string[];
}

export interface PostMediaScheduled extends Omit<PostScheduled, "message"> {
  message?: string;
  media: string | string[];
}

export const defaultConfig: PostRegular = {
  message: "",
};

function toUNIXTime(input: string | Date | number) {
  return parseInt((new Date(input).getTime() / 1000).toFixed(0));
}

function validateSchedule(
  schedule: string | Date | number,
  bypass?: boolean,
  minimum: number = 10 * 60 * 1000,
  threshold: number = 1000,
  warn: boolean = true
) {
  if (bypass) {
    return true;
  }

  // Validate that the schedule is at least 10 minutes from now.
  const now = new Date();
  const later = new Date(schedule);
  const difference = later.getTime() - now.getTime();

  // If the schedule is in the past, return false.
  if (difference < 0) {
    return false;
  }

  if (warn && Math.abs(minimum - difference) <= threshold) {
    warnConsole(
      "The scheduled date is especially close to the current date. This may cause issues with the API.\n" +
        "The threshold of 10 minutes has been roughly met, but consider setting a schedule date later than it is now to prevent issues."
    );
  }

  // If the schedule is less than the threshold, return false.
  // The reason there is a threshold is because when you get `new Date()` to calculate if it's later than ten minutes from now, the instant in which the user (the developer running the API function from the wrapper) runs the function, is different from the instant when this code gets the current time to see if the inputted time is later then ten minutes.
  // Because of this very small difference, you can't input a time that is exactly ten minutes from now.
  // You could possibly fix this better with a floor, but I'm lazy.
  // This is still the lesser of two evils though, because rather than have the problem of not being able to schedule a post exactly ten minutes from now, there's now a chance that the API will throw an error the inputted time is too close to exactly ten minutes.
  // Hacky and long explanation, I know, but this extra function seems to be the best solution.
  return minimum - difference <= threshold;
}

// Private client WeakMap to store Facebook instances
const clientInstances = new WeakMap<Post, Facebook>();

/**
 * A post object with methods for interacting with the post.
 *
 * @property {string} id - The unique identifier for the post.
 * @property {string} user - The ID of the user who created the post.
 * @property {Date} [created] - The date and time when the post was created. Note that when this is returned from the {@link Posts#publish} method, it is automatically set to the current date and time, which is not the way Facebook (or any of the other methods) returns the property.
 * @property {string} [message] - The content of the post.
 * @property {boolean} [success] - Whether the action which was performed on the post was successful.
 */
export class Post {
  id: string;
  user?: string;

  created?: Date;
  message?: string;
  link?: string;

  success?: boolean;
  scheduled?: boolean;

  constructor(
    post: CreatedPost,
    facebook: Facebook,
    config:
      | PostRegular
      | PostLink
      | PostScheduled
      | PostLinkScheduled
      | PostMedia
      | PostMediaScheduled
      | EditPost
      | EditPostEmbedded
      | RemovePost
      | RemovePostEmbedded = defaultConfig
  ) {
    if (post.id === undefined) {
      throw new PostError("Post ID is required.");
    }

    const ids = post.id.split("_");
    const userID = ids.length > 1 ? ids[0] : undefined;
    const postID = ids.length > 1 ? ids[1] : ids[0];
    const scheduled = "schedule" in config;

    this.id = postID;
    this.user = userID;

    this.created = post.created_time
      ? new Date(post.created_time)
      : scheduled
      ? new Date(config.schedule)
      : undefined;
    this.message = post.message || config.message || undefined;
    this.link = `${FACEBOOK_URL}/${postID}`;

    this.success = post.success || true;
    this.scheduled = scheduled || undefined;

    clientInstances.set(this, facebook);
  }

  /**
   * @description Checks if the post has been published. Useful for scheduled posts.
   * @returns {boolean} Whether the post has been published.
   */
  ready() {
    if (this.created === undefined) {
      return false;
    } else {
      return this.created < new Date();
    }
  }

  /**
   * @description Deletes the post.
   * @see {@link Facebook["remove"]}
   * @param config - The configuration object for deleting the post.
   * @param config.id - The ID of the post to delete. By default, this is the ID of the current post. Ideally, you shouldn't change this — if you want to delete a different post, best practice is to use the {@link Posts#remove} method.
   * @see {@link Posts#remove}
   * @extends {Facebook["remove"]}
   **/
  remove(config: RemovePostEmbedded) {
    const client = clientInstances.get(this);
    return client!.posts.remove({ id: this.id, ...config });
  }

  /**
   * @description Edits the post.
   * @see {@link Facebook["edit"]}
   * @param config - The configuration object for editing the post.
   * @param config.id - The ID of the post to edit. By default, this is the ID of the current post. Ideally, you shouldn't change this — if you want to edit a different post, best practice is to use the {@link Posts#edit} method.
   * @see {@link Posts#edit}
   * @extends {Facebook["edit"]}
   **/
  edit(config: EditPostEmbedded) {
    const client = clientInstances.get(this);
    return client!.posts.edit({ id: this.id, ...config });
  }
}

/**
 * Class for managing posts on a Facebook page or user profile.
 * Provides methods for getting, publishing, editing, and deleting posts.
 * You can use this class to manage posts on a page or user profile, but your probably shouldn't access it directly.
 * Instead, access it through the {@link Facebook} class.
 * @see {@link Post}
 * @see {@link Facebook["posts"]}
 * @see {@link Facebook["user"]["posts"]}
 * @see {@link Facebook["page"]["posts"]}
 * @see {@link Facebook["client"]}
 */
export class Posts {
  constructor(private readonly facebook: Facebook) {}

  /**
   * @description Retrieves a post by its ID.
   * @param config - The post ID, or a post object.
   * @returns {Post} A post object with methods for interacting with the post.
   * @throws {PostError} If there is an error getting the post.
   */
  async get(
    config: CreatedPost | Post,
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
   * @param config.schedule - The time to publish the post, if scheduled.
   * @param config.targeting - The targeting options for the post.
   * @param config.bypass - Bypass schedule validation and enter any date as the schedule.
   * @returns A post object with methods for interacting with the post. Note that the `created` property is automatically set to the current date and time, this is not the way Facebook (or any of the other methods) returns it.
   * @see {@link Post#ready} if your posting a scheduled post.
   * @throws {PostError} If something goes wrong trying to publish the post.
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

      if (
        "schedule" in config &&
        validateSchedule(config.schedule, config.bypass) === false
      ) {
        throw new PostError(
          "Schedule date cannot be less than 10 minutes from now."
        );
      }
      const scheduling =
        "schedule" in config
          ? {
              published: false,
              scheduled_publish_time: toUNIXTime(config.schedule),
            }
          : { published: true };

      if ("media" in config) {
      }

      return this.facebook.client
        .post(
          `${id}/feed`,
          stringify({
            ...config,
            ...scheduling,
            access_token: token,
          })
        )
        .then((data: CreatedPost) => new Post(data, this.facebook, config))
        .catch((e: PostError) => {
          throw e;
        });
    });
  }

  /**
   * Publishes a media post to Facebook. For more information on uploading media as posts, see the [Facebook Graph API documentation](https://developers.facebook.com/docs/pages-api/posts/#publish-media-posts).
   * @param config - The configuration object for the photo post.
   * @param config.path - The path of the photo(s) to upload.
   * @param config.url - The URL of the photo(s) to upload.
   * @returns {Post} A post object with methods for interacting with the post.
   * @see {@link Post#ready} if your posting a scheduled post.
   * @throws {PostError} If something goes wrong trying to upload the media.
   */
  async upload(
    config: PostMedia | PostMediaScheduled,
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

      if ("schedule" in config && validateSchedule(config.schedule) === false) {
        throw new PostError(
          "Schedule date cannot be in the past, or be less than 10 minutes from now."
        );
      }

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
          images.forEach((image: { id: string }, i) => {
            body.append(
              `attached_media[${i}]`,
              `{"media_fbid": "${image.id}"}`
            );
          });
          if ("schedule" in config) {
            body.append(
              "scheduled_publish_time",
              toUNIXTime(config.schedule).toString()
            );
            body.append("published", "false");
          } else {
            body.append("published", "true");
          }

          return this.facebook.client
            .post(`${id}/feed`, body, {
              "Content-Type": "application/x-www-form-urlencoded",
            })
            .then((data: CreatedPost) => new Post(data, this.facebook, config))
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
   * @returns {Post} A post object with methods for interacting with the post.
   * @throws {PostError} If something goes wrong trying to edit the post.
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
        .post(
          `${id}_${config.id}`,
          stringify({
            message: config.message,
            access_token: token,
          })
        )
        .then((data: Success) => {
          if (data.success === false) {
            throw new PostError("Failed to edit post.");
          }
          return new Post(data, this.facebook, config);
        });
    });
  }

  /**
   * Deletes a post on Facebook.
   * @param config - The configuration object for deleting the post.
   * @param config.id - The ID of the post to delete.
   * @returns {Post} A post object with methods for interacting with the post.
   * @throws {PostError} If something goes wrong trying to delete the post.
   */
  async remove(
    config: RemovePost,
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
        .post(
          `${id}_${config.id}`,
          stringify({
            access_token: token,
          }),
          { "Content-Type": "application/json" },
          "DELETE"
        )
        .then((data: Success) => {
          return new Post(data, this.facebook, config);
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
   * @returns {Post} A post object with methods for interacting with the post.
   * @throws {PostError} If there is an error getting the post.
   */
  async get(config: CreatedPost) {
    return super.get(config, "user", ["userId", "userToken"], []);
  }

  /**
   * Reads all posts from the profile. Usually not accessible since it requires the `user_posts` permission, which requires special approval from Facebook.
   * @returns {Post[]} An array of post objects.
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
   * @returns {Post} A post object with methods for interacting with the post.
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
   * @returns {Post[]} An array of post objects.
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
   * @param config.schedule - The time to publish the post, if scheduled. Accepts anything that can be parsed by the `Date` constructor.
   * @param config.targeting - The targeting options for the post.
   * @returns {Post} A post object with methods for interacting with the post.
   * @see {@link Post#ready} if your posting a scheduled post.
   * @throws {PostError} If something goes wrong trying to publish the post.
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
   * @see {@link Post#ready} if your posting a scheduled post.
   * @throws {PostError} If something goes wrong trying to upload the media.
   */
  async upload(config: PostMedia | PostMediaScheduled) {
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
   * @see {@link Post#ready} if your editing a scheduled post.
   * @throws {PostError} If something goes wrong trying to edit the post.
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
   * @throws {PostError} If something goes wrong trying to delete the post.
   */
  async remove(config: RemovePost) {
    return super.remove(
      config,
      "page",
      ["pageId", "pageToken"],
      ["pages_read_engagement", "pages_manage_posts"]
    );
  }
}
