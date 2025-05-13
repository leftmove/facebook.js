import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import Facebook from "../";
import type { Profile } from "../";

export function createMCP(facebook: Facebook, profile?: Profile) {
  const server = new McpServer({
    name: "Facebook.js",
    version: "0.1.0",
  });

  let name: string;
  let info;
  let access;
  let client;

  switch (profile) {
    case "user":
      name = "User";
      info = facebook.info.user;
      access = facebook.access.user;
      client = facebook.user;
      break;
    case "page":
      name = "Page";
      info = facebook.info.page;
      access = facebook.access.page;
      client = facebook.page;
      break;
    default:
      throw new Error(`Unknown profile: ${profile}`);
  }

  server.resource(
    name,
    new ResourceTemplate(`info://${profile}`, {
      list: async () => ({
        resources: [
          {
            name: `${profile} info`,
            uri: `info://${profile}`,
            description: `Facebook ${name} ID, expiry, validity`,
            mimeType: "application/json",
          },
        ],
      }),
    }),
    async (uri: URL) => ({
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify({
            id: info.id,
            expires: info.expires,
            valid: info.valid,
          }),
          mimeType: "application/json",
        },
      ],
    })
  );

  server.resource(
    `access-${profile}-token`,
    new ResourceTemplate(`access://${profile}/token`, {
      list: async () => ({
        resources: [
          {
            name: `${profile} token`,
            uri: `access://${profile}/token`,
            description: `Facebook ${name} Access Token`,
            mimeType: "text/plain",
          },
        ],
      }),
    }),
    async (uri: URL) => ({
      contents: [
        {
          uri: uri.href,
          text: access.token || "",
          mimeType: "text/plain",
        },
      ],
    })
  );

  const schedule = z
    .string({
      description: "Schedule time string (parsable by Date constructor)",
    })
    .optional();
  const media = z
    .union(
      [
        z.string({ description: "Media path" }),
        z.array(z.string({ description: "Media path" }), {
          description: "Array of media paths",
        }),
        z.object({
          data: z.string({ description: "Base64 encoded blob image data" }),
          type: z.string({ description: "Extension of the image" }),
        }),
      ],
      {
        description: "Media to attach to the post",
      }
    )
    .optional();

  server.tool(
    `publish-${profile}-post`,
    {
      message: z.string({ description: "Post message" }),
      schedule,
      media,
    },
    async ({ message, schedule, media }) => {
      try {
        const config = {
          message,
          schedule,
          media,
        };
        const post = await client.posts.publish(config);
        const json = post.dump();
        return {
          content: [
            {
              type: "text",
              text: json,
            },
          ],
        };
      } catch (e: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${e.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    `publish-${profile}-comment`,
    {
      parent: z.union([
        z.object({
          id: z.string({ description: "Comment ID" }),
          post: z.string({ description: "Post ID" }),
        }),
        z.object({
          user: z.string({ description: "User ID" }),
          post: z.string({ description: "Post ID" }),
        }),
      ]),
      message: z.string({ description: "Comment message" }),
      schedule,
      media,
    },
    async ({ parent, message, schedule, media }) => {
      try {
        const config = {
          ...parent,
          message,
          media,
          schedule,
        };
        const comment = await client.comments.publish(config);
        const json = comment.dump();
        return {
          content: [
            {
              type: "text",
              text: json,
            },
          ],
        };
      } catch (e: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${e.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  return server;
}
