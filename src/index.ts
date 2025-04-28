import { Facebook } from "./client/client";

export default Facebook;

export { DEFAULT_CONFIG } from "./credentials";
export { DEFAULT_FILE_PATH } from "./credentials";
export { DEFAULT_EXPIRE_ADD } from "./api";
export { DEFAULT_SCOPE } from "./api";
export { FACEBOOK_GRAPH_API } from "./api";
export { DEFAULT_EXPIRE_TIME } from "./api";

export { Post, Comment } from "./client";

export { GraphError, CredentialError, UnauthorizedError } from "./errors";

export { Client } from "./api";
export type { Permissions, Authentication, Profile } from "./api";
export type { Config } from "./client/client";
