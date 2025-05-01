import { Client, Login } from "../api";
import {
  writeToJSONCredentials,
  readFromJSONCredentials,
} from "../credentials";
import { Posts, UserPosts, PagePosts } from "./posts";
import { Comments, PageComments, UserComments } from "./comments";
import { Upload } from "./upload";

import type { writeCredentials, readCredentials } from "../credentials";
import type { Permissions, Info, Access, Profile } from "../api";

/**
 * Get the ID for the given profile.
 * @param profile - The profile to get the ID for.
 * @param t - The Facebook client instance.
 * @returns The ID for the given profile.
 */
export function i(profile: Profile, t: Facebook) {
  return profile === "user" ? t.info.user.id : t.info.page.id;
}

/**
 * Get the access token for the given profile.
 * @param profile - The profile to get the access token for.
 * @param t - The Facebook client instance.
 * @returns The access token for the given profile.
 */
export function t(profile: Profile, t: Facebook) {
  return profile === "user" ? t.access.user.token : t.access.page.token;
}

/**
 * Configuration options for the Facebook client.
 * @see {@link Facebook}
 * @property {string} id - Facebook app ID.
 * @property {string} secret - Facebook app secret.
 * @property {Profile} profile - Profile type to use for API methods ("user" or "page"). Default is "user".
 * @property {Access} access - Pre-configured access tokens and credentials.
 * @property {Info} info - Pre-configured profile information.
 * @property {string} appToken - Facebook app access token.
 * @property {number} appTokenExpires - Expiration time for app access token. Set automatically by the client.
 * @property {string} userToken - Facebook user access token.
 * @property {number} userTokenExpires - Expiration time for user access token. Set automatically by the client.
 * @property {string} userId - Facebook user ID.
 * @property {number} userIdExpires - Expiration time for user ID. Set automatically by the client.
 * @property {string} pageId - Facebook page ID.
 * @property {number} pageIdExpires - Expiration time for page ID. Set automatically by the client.
 * @property {number} pageIndex - Index of the page to use if user manages multiple pages. Defaults to 0.
 * @property {string} pageToken - Facebook page access token.
 * @property {number} pageTokenExpires - Expiration time for page access token. Set automatically by the client.
 * @property {Permissions} scope - Permission scopes to request during authentication.
 * @property {writeCredentials} writeCredentials - Function to write credentials to storage.
 * @property {readCredentials} readCredentials - Function to read credentials from storage.
 * @property {boolean} overrideLocal - Whether to override locally stored credentials.
 */
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
  warnExpired?: boolean;
}

/**
 * Facebook API client class.
 * Provides methods for interacting with Facebook's Graph API.
 * This is the main class you'll use to interact with this library.
 * @see {@link Posts}
 * @see {@link Comments}
 * @see {@link Upload}
 */
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
   * Returns an object with methods for interacting with Facebook uploads.
   * @type {Upload}
   */
  upload = new Upload(this);

  /**
   * User-specific operations
   * @property {UserPosts} posts - Methods for interacting with posts on a user profile
   * @property {UserComments} comments - Methods for interacting with comments on a user profile
   */
  user = {
    posts: new UserPosts(this),
    comments: new UserComments(this),
  };

  /**
   * Page-specific operations
   * @property {PagePosts} posts - Methods for interacting with posts on a Facebook page
   * @property {PageComments} comments - Methods for interacting with comments on a Facebook page
   */
  page = {
    posts: new PagePosts(this),
    comments: new PageComments(this),
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
}
