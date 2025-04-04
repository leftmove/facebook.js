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
  url: URL | URL[];
}

interface PostMediaLinkScheduled extends PostMediaLink {
  published: boolean;
  scheduled_publish_time: number;
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

export class Posts {
    constructor(private facebook: Facebook) {}

    /**
     * Retrieves a post by its ID.
     * @param postId - The ID of the post to retrieve.
     * @returns The post data.
     * @throws {PostError} If there is an error getting the post.
     */
    async get(config: CreatedPost, profile: Profile = this.facebook.profile) {
        const id = i(profile, this.facebook);
        const token = t(profile, this.facebook);
        return this.facebook.client
            .get(`${id}_${config.id}`, {
                access_token: token,
            })
            .catch((e: PostError) => {
                throw e;
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
     * @returns A post object with methods for interacting with the post.
     */
    async publish(
        config: PostRegular | PostLink | PostScheduled | PostLinkScheduled,
        profile: Profile = this.facebook.profile
    ): Promise<Post> {
        const id = i(profile, this.facebook);
        const token = t(profile, this.facebook);
        return this.facebook.refresh(["pageId", "pageToken"]).then(() =>
            this.facebook.client
                .post(`${id}/feed`, {
                    ...config,
                    access_token: token,
                })
                .then((data: CreatedPost) => new Post(data.id, this.facebook))
                // .catch((e: PostError) => {
                //     throw e
                // })
        );
    }

    /**
     * Publishes a media post to Facebook. For more information on uploading media as posts, see the [Facebook Graph API documentation](https://developers.facebook.com/docs/pages-api/posts/#publish-media-posts).
     * @param config - The configuration object for the photo post.
     * @param config.path - The path of the photo(s) to upload.
     * @param config.url - The URL of the photo(s) to upload.
     * @returns A post object with methods for interacting with the post.
     */
    async upload(
        config: PostMedia | PostMediaScheduled | PostMediaLink | PostMediaLinkScheduled,
        profile: Profile = this.facebook.profile
    ): Promise<CreatedPost> {
        const id = i(profile, this.facebook);
        const token = t(profile, this.facebook);
        return this.facebook.refresh(["userToken", "pageId", "pageToken"]).then(() => {

            let imagePromises;

            if ('path' in config) {
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

                assert(id, "Token is missing.");
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
                        resolve(this.facebook.client.post(`me/photos`, form, {}));
                    } catch (error) {
                        throw new PostError("Error uploading photo.", error);
                    }
                });
            };   
            imagePromises = Array.isArray(config.path)
            ? config.path.map((path) => {
                return file(path);
            })
            : [file(config.path)]
            } else if ('url' in config) {
              imagePromises = Array.isArray(config.url)
              ? config.url.map((url) => {
                return {
                  id: url,
                }
              })
              : [{id: config.url}]
            }

            assert(imagePromises, "Invalid config.");

            return Promise.all(
                imagePromises
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
                        JSON.stringify({ media_fbid: image.id })
                    );
                });
                return this.facebook.client
                    .post(`${id}/feed`, body, {
                        "Content-Type": "application/x-www-form-urlencoded",
                    })
                    .then((data: CreatedPost) => new Post(data.id, this.facebook))
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
        profile: Profile = this.facebook.profile
    ): Promise<Success> {
        const id = i(profile, this.facebook);
        const token = t(profile, this.facebook);
        return this.facebook.refresh(["pageId", "pageToken"]).then(() =>
            this.facebook.client.post(`${id}_${config.id}`, {
                message: config.message,
                access_token: token,
            }).catch((e: PostError) => {
                throw e;
            })
        );
    }

    /**
     * Deletes a post on Facebook.
     * @param config - The configuration object for deleting the post.
     * @param config.id - The ID of the post to delete.
     * @returns Success status.
     */
    async remove(
        config: CreatedPost,
        profile: Profile = this.facebook.profile
    ): Promise<Success> {
        const id = i(profile, this.facebook);
        const token = t(profile, this.facebook);
        return this.facebook.refresh(["userId", "pageToken"]).then(() =>
            this.facebook.client.post(
                `${id}_${config.id}`,
                {
                    access_token: token,
                },
                { "Content-Type": "application/json" },
                "DELETE"
            ).catch((e: PostError) => {
                throw e;
            })
        );
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
        return super.get(config, "user");
    }

    /**
     * Publishes a post to the user's profile.
     * @param config - The configuration object for the post.
     * @param config.message - The caption of the post.
     * @param config.link - The link of the post, if the post is a link post.
     * @param config.published - Whether the post is published now or scheduled.
     * @param config.scheduled_publish_time - The time to publish the post, if scheduled.
     * @param config.targeting - The targeting options for the post.
     * @returns A post object with methods for interacting with the post.
     */
    async publish(config: PostRegular | PostLink | PostScheduled | PostLinkScheduled) {
        return super.publish(config, "user");
    }

    /**
     * Publishes a media post to the user's profile.
     * @param config - The configuration object for the media post.
     * @param config.path - The path of the media file(s) to upload.
     * @param config.url - The URL of the media file(s) to upload.
     * @returns A post object with methods for interacting with the post.
     */
    async upload(config: PostMedia | PostMediaScheduled) {
        return super.upload(config, "user");
    }

    /**
     * Edits a post on the user's profile.
     * @param config - The configuration object for editing the post.
     * @param config.id - The ID of the post to edit.
     * @param config.message - The new message for the post.
     * @returns Success status.
     */
    async edit(config: EditPost) {
        return super.edit(config, "user");
    }

    /**
     * Deletes a post from the user's profile.
     * @param config - The configuration object for deleting the post.
     * @param config.id - The ID of the post to delete.
     * @returns Success status.
     */
    async remove(config: CreatedPost) {
        return super.remove(config, "user");
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
        return super.get(config, "page");
    }

    /**
     * Publishes a post to the page.
     * @param config - The configuration object for the post.
     * @param config.message - The caption of the post.
     * @param config.link - The link of the post, if the post is a link post.
     * @param config.published - Whether the post is published now or scheduled.
     * @param config.scheduled_publish_time - The time to publish the post, if scheduled.
     * @param config.targeting - The targeting options for the post.
     * @returns A post object with methods for interacting with the post.
     */
    async publish(config: PostRegular | PostLink | PostScheduled | PostLinkScheduled) {
        return super.publish(config, "page");
    }

    /**
     * Publishes a media post to the page.
     * @param config - The configuration object for the media post.
     * @param config.path - The path of the media file(s) to upload.
     * @param config.url - The URL of the media file(s) to upload.
     * @returns A post object with methods for interacting with the post.
     */
    async upload(config: PostMedia | PostMediaScheduled) {
        return super.upload(config, "page");
    }

    /**
     * Edits a post on the page.
     * @param config - The configuration object for editing the post.
     * @param config.id - The ID of the post to edit.
     * @param config.message - The new message for the post.
     * @returns Success status.
     */
    async edit(config: EditPost) {
        return super.edit(config, "page");
    }

    /**
     * Deletes a post from the page.
     * @param config - The configuration object for deleting the post.
     * @param config.id - The ID of the post to delete.
     * @returns Success status.
     */
    async remove(config: CreatedPost) {
        return super.remove(config, "page");
    }
}
