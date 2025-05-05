import { i, t } from "./client";
import { FACEBOOK_URL, parameterize } from "../api";

import { PostError } from "../errors";

import type { Facebook } from "./client";
import type { Profile } from "../api";
import type { Post } from "./posts";

interface CreatedComment {
  created_time?: string;
  from?: {
    name: string;
    id: string;
  };
  message?: string;
  id?: string;
  post?: string;
  success?: boolean;
}

/**
 * Configuration object for publishing a comment.
 * @property {string} post - The ID of the post to comment on.
 * @property {string} user - The ID of the user to comment as.
 * @property {string} message - The message to publish.
 */
export interface CommentRegular {
  post: string;
  user?: string;
  message: string;
  can_comment?: boolean;
  can_remove?: boolean;
  can_hide?: boolean;
  can_like?: boolean;
  can_reply_privately?: boolean;
}

/**
 * Configuration object for publishing a comment on a post.
 * @property {string} post - The ID of the post to comment on.
 * @property {string} user - The ID of the user to comment as.
 * @property {string} message - The message to publish.
 */
export interface CommentPost extends Omit<CommentRegular, "post"> {
  post: string;
  user: string;
  message: string;
  can_comment?: boolean;
  can_remove?: boolean;
  can_hide?: boolean;
  can_like?: boolean;
  can_reply_privately?: boolean;
}

/**
 * Configuration object for publishing a comment reply.
 * @property {string} comment - The ID of the comment to reply to.
 * @property {string} user - The ID of the user to reply as.
 * @property {string} message - The message to publish.
 */
export interface CommentReply extends Omit<CommentPost, "user"> {
  user?: string;
  id: string;
}

/**
 * Configuration object for publishing a comment with media.
 * @extends {CommentRegular}
 * @property {string} message - The message to publish.
 * @property {string} media - The path of the media to upload — only accepts a single path.
 */
export interface CommentMedia extends Omit<CommentRegular, "message"> {
  message?: string;
  media: string;
}

/**
 * Configuration object for publishing a comment reply with media.
 * @extends {CommentReply}
 * @property {string} media - The path of the media to upload — only accepts a single path.
 */
export type CommentReplyMedia = CommentReply & CommentMedia;

/**
 * Class for managing comments on a post.
 * @see {@link Comments}
 * @see {@link Facebook["comments"]}
 */

export const defaultConfig: CommentRegular = {
  message: "",
  post: "",
};

export class Comment {
  profile: Profile;
  id: string;
  post?: string;
  user?: string;

  created?: Date;
  message?: string;
  username?: string;
  link?: string;

  success?: boolean;

  private client: Facebook;

  private _customFields: Set<string> = new Set([
    "id",
    "from",
    "create_time",
    "message",
    "success",
  ]); // Fields that are set by the constructor, from the API response. Don't need to be set again.

  constructor(
    comment: CreatedComment,
    facebook: Facebook,
    config:
      | Post
      | CreatedComment
      | CommentRegular
      | CommentMedia
      | CommentReply
      | CommentReplyMedia = defaultConfig,
    profile: Profile = facebook.profile
  ) {
    if (comment.id === undefined) {
      throw new PostError("Comment ID is required.");
    }

    const ids = comment.id.split("_");
    const postID =
      ids.length > 1
        ? ids[0]
        : ("post" in config ? config.post : undefined) || undefined;
    const commentID = ids.length > 1 ? ids[1] : ids[0];

    const userID =
      comment.from?.id ||
      ("user" in config ? config.user : undefined) ||
      undefined;
    const username = comment.from?.name || undefined;

    this.id = commentID;
    this.post = postID;
    this.user = userID;
    this.username = username;

    this.created = comment.created_time
      ? new Date(comment.created_time)
      : undefined;
    this.message = comment.message || config.message || undefined;
    this.link = `${FACEBOOK_URL}/${postID}_${commentID}`;

    this.success = comment.success || true;

    this.client = facebook;
    this.profile = profile;
    Object.keys(comment)
      .filter((key) => !this._customFields.has(key))
      .forEach((key) => {
        const commentValue = comment[key as keyof CreatedComment];
        if (commentValue !== undefined) {
          (this as any)[key] = commentValue;
        }
      });
  }

  /**
   * Retrieves the parent post of the comment.
   * @param profile - The profile to use for the request.
   * @returns {Post} The parent post of the comment.
   */
  parent(profile: Profile = this.profile) {
    return this.client.posts.get({ id: this.post }, profile);
  }

  /**
   * Publishes a reply to the comment.
   * @param config - The configuration object for publishing a reply.
   * @param config.comment - The ID of the comment to reply to.
   * @param config.user - The ID of the user to reply as.
   * @param config.message - The message to publish.
   * @param config.media - The path of the media to upload — only accepts a single path.
   */
  reply(
    config: CommentReply | CommentReplyMedia,
    profile: Profile = this.profile
  ) {
    return this.client.comments.publish(config, profile);
  }
}

/**
 * Class for managing comments on a post.
 * @see {@link Comments}
 * @see {@link Facebook["comments"]}
 * @see {@link Facebook["post"]["comments"]}
 * @see {@link Facebook["page"]["comments"]}
 */
export class Comments {
  constructor(private readonly facebook: Facebook) {}

  /**
   * Read comments from a post.
   * @param config.id - The post ID.
   * @returns {Comment[]} An array of comment objects.
   * @throws {PostError} If there is an error reading the comments.
   */
  read(
    config: Post,
    profile: Profile = this.facebook.profile,
    credentials: string[] = profile === "page" ? ["pageToken"] : ["userToken"],
    permissions: string[] = profile === "page"
      ? ["pages_manage_engagement", "pages_read_engagement"]
      : []
  ) {
    const id = i(profile, this.facebook);
    const token = t(profile, this.facebook);
    interface ResponseComments {
      data: Array<{
        created_time: string;
        from: {
          name: string;
          id: string;
        };
        message: string;
        id: string;
      }>;
      paging: {
        cursors: {
          before: string;
          after: string;
        };
      };
    }
    return this.facebook.refresh(credentials, permissions).then(() => {
      return this.facebook.client
        .get(`${config.user || id}_${config.id}/comments`, {
          access_token: token,
        })
        .then((response: ResponseComments) =>
          response.data.map(
            (comment: CreatedComment) =>
              new Comment(comment, this.facebook, config)
          )
        );
    });
  }

  /**
   * Get a comment by its ID.
   * @param config.id - The comment ID.
   * @returns {Comment} A comment object with methods for interacting with the comment.
   * @throws {PostError} If there is an error getting the comment.
   */
  get(
    config: CreatedComment,
    profile: Profile = this.facebook.profile,
    credentials: string[] = profile === "page" ? ["pageToken"] : ["userToken"],
    permissions: string[] = profile === "page" ? [] : []
  ) {
    return this.facebook.refresh(credentials, permissions).then(() => {
      const token = t(profile, this.facebook);

      if (config.id === undefined) {
        throw new PostError(
          "Comment ID is required. Both post and comment ID are required — you can either provide them as a single string or as two separate strings with the `post` and `id` properties."
        );
      }

      let post: string;
      let comment: string;

      if (config.id.includes("_")) {
        const ids = config.id.split("_");
        post = ids[0];
        comment = ids[1];
      } else {
        if (config.post === undefined) {
          throw new PostError("Post ID is required.");
        }
        post = config.post;
        comment = config.id;
      }

      return this.facebook.client
        .get(`${post}_${comment}`, {
          access_token: token,
        })
        .then(
          (data: CreatedComment) => new Comment(data, this.facebook, config)
        );
    });
  }

  /**
   * Publishes a comment to a post.
   * @param config - The configuration object for publishing a comment.
   * @param config.post - The ID of the post to publish a comment to.
   * @param config.user - The ID of the user to publish a comment as.
   * @param config.message - The message of the comment.
   * @param config.media - The path of the media to upload — only accepts a single path, as multiple uploads are not supported.
   */
  publish(
    config: CommentRegular | CommentMedia | CommentReply | CommentReplyMedia,
    profile: Profile = this.facebook.profile,
    credentials: string[] = profile === "page" ? ["pageToken"] : ["userToken"],
    permissions: string[] = profile === "page" ? [] : []
  ) {
    return this.facebook.refresh(credentials, permissions).then(async () => {
      if (config.post === undefined) {
        throw new PostError("Post ID is required.");
      }

      const token = t(profile, this.facebook);
      const post = config.post;
      const user = config.user;

      let endpoint: string = `${user}_${post}/comments`;
      if ("user" in config && "post" in config) {
        endpoint = `${config.user}_${config.post}/comments`;
      } else if ("id" in config && "post" in config) {
        endpoint = `${config.post}_${config.id}/comments`;
      } else {
        throw new PostError(
          "Either `user` and `post` or `id` and `post` must be provided.\n" +
            "You can provide them as a single string or as two separate strings with the `user`, `id`, and `post` properties.\n" +
            "This is to ensure that you are providing either a post (user ID and post ID) or a comment (post ID and comment ID) to reply to."
        );
      }

      const attachment =
        "media" in config
          ? await this.facebook.upload
              .image({ media: config.media }, profile)
              .then((images) => {
                if (images.length === 0) {
                  throw new PostError("No media uploaded.");
                }
                return { attachment_id: images[0].id };
              })
          : {};

      return this.facebook.client
        .post(
          endpoint,
          parameterize({
            access_token: token,
            message: config.message,
            ...attachment,
          })
        )
        .then(
          (response: CreatedComment) =>
            new Comment(response, this.facebook, config, profile)
        );
    });
  }
}

/**
 * Class for managing comments on a user.
 * @see {@link Comments}
 * @see {@link Facebook["comments"]}
 * @see {@link Facebook["user"]["comments"]}
 */
export class UserComments extends Comments {
  constructor(facebook: Facebook) {
    super(facebook);
  }

  read(config: Post) {
    return super.read(config, "user");
  }
}

/**
 * Class for managing comments on a page.
 * @see {@link Comments}
 * @see {@link Facebook["comments"]}
 * @see {@link Facebook["page"]["comments"]}
 */
export class PageComments extends Comments {
  constructor(facebook: Facebook) {
    super(facebook);
  }

  read(config: Post) {
    return super.read(config);
  }
}
