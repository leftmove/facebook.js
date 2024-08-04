import { Facebook } from "./client/client";

export default Facebook;

export { DEFAULT_CONFIG } from "./credentials";
export { DEFAULT_FILE_PATH } from "./credentials";
export { DEFAULT_SCOPE } from "./api";
export { FACEBOOK_GRAPH_API } from "./api";
export { DEFAULT_EXPIRE_TIME } from "./api";

export { CredentialError, UnauthorizedError } from "./errors";

export { Client } from "./api";
export type { Permissions, Authentication } from "./api";
