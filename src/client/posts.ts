import { Facebook, i, t } from "./client";
import { DeprecatedError, PostError, warnConsole } from "../errors";
import { stringify, parameterize } from "../api";
import { FACEBOOK_URL } from "../api";

import type { Profile } from "../api";
import type { ImageUpload } from "./upload";
import type { CommentRegular, CommentMedia } from "./comments";

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

/**
 * Configuration object for publishing a post.
 * @property {string} message - The message to publish.
 * @property {Targeting} [targeting] - The targeting options for the post.
 */
export interface PostRegular {
  message: string;
  targeting?: Targeting;
}

/**
 * Configuration object for publishing a scheduled post.
 * @extends {PostRegular}
 * @property {string} schedule - The date and time to publish the post.
 * @property {boolean} [bypass] - Bypass schedule validation and enter any date as the schedule.
 */
export interface PostScheduled extends PostRegular {
  schedule: string | Date;
  bypass?: boolean;
}

/**
 * Configuration object for publishing a link post.
 * @extends {PostRegular}
 * @property {string} link - The link to publish.
 * @property {string} [message] - The message to publish.
 */
export interface PostLink extends Omit<PostRegular, "message"> {
  link: string;
  message?: string;
}

/**
 * Configuration object for publishing a scheduled link post.
 * @extends {PostLink}
 * @property {string} schedule - The date and time to publish the post.
 * @property {boolean} [bypass] - Bypass schedule validation and enter any date as the schedule.
 */
export type PostLinkScheduled = PostLink & PostScheduled;

/**
 * Configuration object for publishing a post with media.
 * @extends {PostRegular}
 * @property {string} media - The path of the media to upload — accepts either a single path or an array of paths.
 */
export interface PostMedia extends Omit<PostRegular, "message"> {
  message?: string;
  media: string | string[];
}

/**
 * Configuration object for publishing a scheduled post with media.
 * @extends {PostScheduled}
 * @property {string} media - The path of the media to upload — accepts either a single path or an array of paths.
 */
export type PostMediaScheduled = PostMedia & PostScheduled;

export type PostPublish =
  | PostRegular
  | PostLink
  | PostMedia
  | PostMediaScheduled
  | PostScheduled
  | PostLinkScheduled;

export type PostConfig =
  | PostRegular
  | PostLink
  | PostScheduled
  | PostLinkScheduled
  | PostMedia
  | PostMediaScheduled
  | EditPost
  | EditPostEmbedded
  | RemovePost
  | RemovePostEmbedded;

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
  const valid = minimum - difference <= threshold;

  if (valid === false) {
    throw new PostError(
      "Schedule date cannot be less than 10 minutes from now."
    );
  } else {
    return valid;
  }
}

/**
 * A post object with methods for interacting with the post.
 * @property {string} id - The unique identifier for the post.
 * @property {string} user - The ID of the user who created the post.
 * @property {Date} [created] - The date and time when the post was created. Note that when this is returned from the {@link Posts#publish} method, it is automatically set to the current date and time, which is not the way Facebook (or any of the other methods) returns the property.
 * @property {string} [message] - The content of the post.
 * @property {boolean} [success] - Whether the action which was performed on the post was successful.
 */
export class Post {
  profile: Profile;
  id: string;
  user?: string;

  created?: Date;
  message?: string;
  link?: string;

  success?: boolean;
  scheduled?: boolean;

  private client: Facebook;

  private _customFields: Set<string> = new Set([
    "id",
    "user",
    "created",
    "message",
    "success",
  ]); // Fields that are set by the constructor, from the API response. Don't need to be set again.
  private _dumpFields: Set<string> = new Set([
    "id",
    "user",
    "profile",
    "created",
    "message",
    "success",
    "scheduled",
    "link",
  ]);

  constructor(
    post: CreatedPost,
    facebook: Facebook,
    config: PostConfig = defaultConfig,
    profile: Profile = facebook.profile
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
      : new Date();
    this.message = post.message || config.message || undefined;
    this.link = `${FACEBOOK_URL}/${postID}`;

    this.success = post.success || true;
    this.scheduled = scheduled || false;

    this.profile = profile;
    this.client = facebook;
    Object.keys(post)
      .filter((key) => !this._customFields.has(key))
      .forEach((key) => {
        const postValue = post[key as keyof CreatedPost];
        if (postValue !== undefined) {
          (this as any)[key] = postValue;
        }
      });
  }

  /**
   * Checks if the post has been published. Useful for scheduled posts.
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
   * Deletes the post.
   * @see {@link Facebook["remove"]}
   * @param config - The configuration object for deleting the post.
   * @param config.id - The ID of the post to delete. By default, this is the ID of the current post. Ideally, you shouldn't change this — if you want to delete a different post, best practice is to use the {@link Posts#remove} method.
   * @see {@link Posts#remove}
   * @extends {Facebook["remove"]}
   **/
  remove(config: RemovePostEmbedded, profile: Profile = this.profile) {
    return this.client.posts.remove({ id: this.id, ...config }, profile);
  }

  /**
   * Edits the post.
   * @see {@link Facebook["edit"]}
   * @param config - The configuration object for editing the post.
   * @param config.id - The ID of the post to edit. By default, this is the ID of the current post. Ideally, you shouldn't change this — if you want to edit a different post, best practice is to use the {@link Posts#edit} method.
   * @see {@link Posts#edit}
   * @extends {Facebook["edit"]}
   **/
  edit(config: EditPostEmbedded, profile: Profile = this.profile) {
    return this.client.posts.edit({ id: this.id, ...config }, profile);
  }

  /**
   * Retrieves comments from the post.
   * @param config.id - The post ID.
   * @returns {Comment[]} An array of comment objects.
   * @throws {PostError} If there is an error reading the comments.
   */
  comments(config: Post) {
    return this.client.comments.read(config, this.profile);
  }

  /**
   * Replies a comment on the post.
   * @param config - The configuration object for publishing a comment.
   * @param config.post - The ID of the post to publish a comment to.
   * @param config.user - The ID of the user to publish a comment as.
   * @param config.message - The message of the comment.
   * @param config.media - The path of the media to upload — only accepts a single path, as multiple uploads are not supported.
   */
  reply(config: CommentRegular | CommentMedia) {
    return this.client.comments.publish(config, this.profile);
  }

  /**
   * Dumps the post to a JSON string.
   * @returns {string} The JSON string.
   */
  dump() {
    return stringify(
      [...this._dumpFields].reduce(
        (obj, key) => ({ ...obj, [key]: (this as any)[key] }),
        {}
      )
    );
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
   * Retrieves a post by its ID.
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
        .then(
          (data: CreatedPost) => new Post(data, this.facebook, config, profile)
        )
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
          return posts.data.map(
            (post) => new Post(post, this.facebook, defaultConfig, profile)
          );
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
    config: PostPublish,
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

      const scheduling =
        "schedule" in config && validateSchedule(config.schedule, config.bypass)
          ? {
              published: false,
              scheduled_publish_time: toUNIXTime(config.schedule),
            }
          : { published: true };

      const media: ImageUpload[] =
        "media" in config
          ? await this.facebook.upload
              .image({ media: config.media }, profile)
              .then((images) =>
                images.map((image) => {
                  return stringify({ media_fbid: image.id });
                })
              )
          : [];
      const attachments =
        "media" in config
          ? media.reduce((acc: Record<string, ImageUpload>, mediaId, index) => {
              acc[`attached_media[${index}]`] = mediaId;
              return acc;
            }, {})
          : {};

      return this.facebook.client
        .post(
          `${id}/feed`,
          parameterize({
            ...config,
            ...scheduling,
            ...attachments,
            access_token: token,
          }) // Parameterized instead of stringified because it could contain attachments.
        )
        .then(
          (data: CreatedPost) => new Post(data, this.facebook, config, profile)
        )
        .catch((e: PostError) => {
          throw e;
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
          return new Post(data, this.facebook, config, profile);
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
          return new Post(data, this.facebook, config, profile);
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
  async publish(config: PostPublish) {
    return super.publish(
      config,
      "page",
      ["pageId", "pageToken"],
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
