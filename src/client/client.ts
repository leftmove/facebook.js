import { Client, Login } from "../api";
import { writeToJSONCredentials, readFromJSONCredentials } from "../credentials";
import { CredentialError, PostError } from "../errors";
import type { writeCredentials, readCredentials } from "../credentials";
import type { Permissions, Info, Access, Profile } from "../api";

import { Posts, UserPosts, PagePosts } from "./posts";

// Optional config for the Facebook client. Don't know how to include without adding clutter.

// * @internal @param config.access - Pre-configured access tokens and credentials.
// * @internal @param config.info - Pre-configured profile information.
// * @internal @param config.appToken - Facebook app access token.
// * @internal @param config.appTokenExpires - Expiration time for app access token. Set automatically by the client.
// * @internal @param config.userToken - Facebook user access token.
// * @internal @param config.userTokenExpires - Expiration time for user access token. Set automatically by the client.
// * @internal @param config.userId - Facebook user ID.
// * @internal @param config.userIdExpires - Expiration time for user ID. Set automatically by the client.
// * @internal @param config.pageId - Facebook page ID.
// * @internal @param config.pageIdExpires - Expiration time for page ID. Set automatically by the client.  
// * @internal @param config.pageIndex - Index of the page to use if user manages multiple pages.
// * @internal @param config.pageToken - Facebook page access token.
// * @internal @param config.pageTokenExpires - Expiration time for page access token. Set automatically by the client.


export interface Config {
  id?: string;
  secret?: string;
  profile?: Profile;

  access?: Access;
  info?: Info;

  appToken?: string;
  appTokenExpires?: number;
  userToken?: string;
  userTokenExpires?: number;
  userId?: string;
  userIdExpires?: number;
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

export class Facebook extends Login {
  client = new Client();

  /**
   * Creates a new Facebook API client instance
   * @param config - Configuration options for the Facebook client
   * @param config.id - Facebook app ID
   * @param config.secret - Facebook app secret
   * @param config.profile - Profile type to use for API methods ("user" or "page"). Default is "user".
   * 
   * @param config.scope - Permission scopes to request during authentication. For more information, see the {@link Permissions} interface and the {@link https://developers.facebook.com/docs/permissions/reference Facebook Graph API documentation}.
   * @param config.writeCredentials - Function to write credentials to storage. Default is to write to a local JSON file through {@link writeToJSONCredentials}.
   * @param config.readCredentials - Function to read credentials from storage. Default is to read from a local JSON file through {@link readFromJSONCredentials}.
   * @param config.overrideLocal - Whether to override locally stored credentials. Default is true.
   */
  constructor(config: Config = {}) {
    super(config);
  }

  /**
   * Returns an object with methods for interacting with Facebook posts.
   * @type {Posts}
   */
  posts = new Posts(this);

  /**
   * User-specific operations
   * @property {UserPosts} posts - Methods for interacting with posts on a user profile
   */
  user = {
    /**
     * Methods for interacting with posts on a user profile
     * @type {UserPosts}
     */
    posts: new UserPosts(this),
  };

  /**
   * Page-specific operations
   * @property {PagePosts} posts - Methods for interacting with posts on a Facebook page
   */
  page = {
    /**
     * Methods for interacting with posts on a Facebook page
     * @type {PagePosts}
     */
    posts: new PagePosts(this),
  };

  /**
   * Switches the profile type for API methods.
   * @param profile Type of profile to use for API methods, takes either "user" or "page".
   * @returns {this} Client instance, used for chaining methods.
   */
  switch(profile: Profile) {
    this.profile = profile;
    return this;
  }

  // /**
  //  * Retrieves a comment by its ID.
  //  * @param postId - The ID of the post or comment to reply to. If the comment is a reply, this should be the ID of the parent comment.
  //  * @returns The comment data.
  //  * @throws {PostError} If there is an error getting the comment.
  //  **/
  // publishComment(postId: string, message: string) {
  //   return this.refresh(["pageToken"]).then(() => {
  //     try {
  //       return this.client.post(postId, {
  //         message,
  //         access_token: this.access.page.token,
  //       });
  //     } catch (error) {
  //       throw new PostError("Error publishing comment.", error);
  //     }
  //   });
  // }

  /**
   * Returns an object with methods for interacting with Facebook comments.
   * @returns {object} An object with methods for interacting with Facebook comments
   */
  comments() {
    return {};
  }
}
