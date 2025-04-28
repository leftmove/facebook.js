import { i, t } from "./client";
import { FACEBOOK_URL, stringify } from "../api";
import { PostError } from "../errors";

import type { Facebook } from "./client";
import type { Profile } from "../api";
import type { CreatedPost, Post } from "./posts";
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

export interface CommentRegular {
  post: string;
  user: string;
  message: string;
}

export interface CommentMedia extends Omit<CommentRegular, "message"> {
  message?: string;
  path: string | string[];
}

// Private client WeakMap to store Facebook instances
const clientInstances = new WeakMap<Comment, Facebook>();
/**
 * Class for managing comments on a post.
 * @see {@link Comments}
 * @see {@link Facebook["comments"]}
 */
export class Comment {
  id: string;
  post?: string;
  user?: string;

  created?: Date;
  message?: string;
  username?: string;
  link?: string;

  success?: boolean;

  constructor(comment: CreatedComment, facebook: Facebook) {
    if (comment.id === undefined) {
      throw new PostError("Comment ID is required.");
    } else if (comment.from?.id === undefined) {
      throw new PostError("Comment author ID is required.");
    }

    const ids = comment.id.split("_");
    const postID = ids.length > 1 ? ids[0] : undefined;
    const commentID = ids.length > 1 ? ids[1] : ids[0];
    const userID = comment.from.id;
    const username = comment.from.name;

    this.id = commentID;
    this.post = postID;
    this.user = userID;
    this.username = username;

    this.created = comment.created_time
      ? new Date(comment.created_time)
      : undefined;
    this.message = comment.message || undefined;
    this.link = `${FACEBOOK_URL}/${postID}_${commentID}`;

    this.success = comment.success || true;

    clientInstances.set(this, facebook);
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
            (comment: CreatedComment) => new Comment(comment, this.facebook)
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
        .then((data: CreatedComment) => new Comment(data, this.facebook));
    });
  }

  publish(
    config: CommentRegular,
    profile: Profile = this.facebook.profile,
    credentials: string[] = profile === "page" ? ["pageToken"] : ["userToken"],
    permissions: string[] = profile === "page" ? [] : []
  ) {
    return this.facebook.refresh(credentials, permissions).then(() => {
      if (config.post === undefined) {
        throw new PostError("Post ID is required.");
      }

      if (config.user === undefined) {
        throw new PostError("User ID is required.");
      }

      const token = t(profile, this.facebook);
      const post = config.post;
      const user = config.user;

      return this.facebook.client
        .post(
          `${user}_${post}/comments`,
          stringify({
            access_token: token,
            message: config.message,
          })
        )
        .then(
          (response: CreatedComment) => new Comment(response, this.facebook)
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
