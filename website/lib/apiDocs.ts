import { cache } from "react";

export type MethodDoc = {
  name: string;
  signature: string;
  description: string;
  params?: { name: string; type: string; description: string }[];
  returns?: string;
  example?: string;
};

export type ClassDoc = {
  name: string;
  description: string;
  methods: MethodDoc[];
};

const docs: Record<string, ClassDoc> = {
  Client: {
    name: "Client",
    description:
      "The main Facebook.js client. Handles authentication and API requests.",
    methods: [
      {
        name: "login",
        signature: "login(credentials: Credentials): Promise<void>",
        description: "Logs in to Facebook using the provided credentials.",
        params: [
          {
            name: "credentials",
            type: "Credentials",
            description: "The login credentials.",
          },
        ],
        returns: "Promise<void>",
        example: "await client.login({ email, password });",
      },
      {
        name: "logout",
        signature: "logout(): Promise<void>",
        description: "Logs out of Facebook.",
        returns: "Promise<void>",
      },
    ],
  },
  Posts: {
    name: "Posts",
    description: "Manages Facebook posts: create, read, update, delete.",
    methods: [
      {
        name: "publish",
        signature: "publish(config: PostConfig): Promise<Post>",
        description: "Publishes a new post to Facebook.",
        params: [
          {
            name: "config",
            type: "PostConfig",
            description: "The post configuration.",
          },
        ],
        returns: "Promise<Post>",
        example: 'await posts.publish({ message: "Hello!" });',
      },
      {
        name: "read",
        signature: "read(): Promise<Post[]>",
        description: "Reads all posts from the profile.",
        returns: "Promise<Post[]>",
      },
    ],
  },
  Pages: {
    name: "Pages",
    description: "Manages Facebook pages.",
    methods: [
      {
        name: "get",
        signature: "get(id: string): Promise<Page>",
        description: "Retrieves a page by its ID.",
        params: [{ name: "id", type: "string", description: "The page ID." }],
        returns: "Promise<Page>",
      },
    ],
  },
  Users: {
    name: "Users",
    description: "Manages Facebook user profiles.",
    methods: [
      {
        name: "get",
        signature: "get(id: string): Promise<User>",
        description: "Retrieves a user by their ID.",
        params: [{ name: "id", type: "string", description: "The user ID." }],
        returns: "Promise<User>",
      },
    ],
  },
};

export const getClassDoc = cache(async (className: string) => {
  // Simulate async/cache for future extensibility
  return docs[className];
});
