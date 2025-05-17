import { i, t } from "./client";
import type { Profile } from "../api/login";
import type { Facebook } from "./client";
import { PostError } from "../errors";

import fs from "fs";
import tmp from "tmp";
import assert from "assert";

export interface ImageId {
  media_fbid: string;
}

export type Media = string | string[];

export type ImageUpload = ImageId | Media;

export interface ImageBlob {
  data: string;
  extension: string;
}

interface UploadConfig {
  media: Media | ImageBlob;
}

const supportedImageExtensions = ["jpg", "bmp", "png", "gif", "tiff"];

interface ImageResponse {
  id: string;
}

const clientInstances = new WeakMap<Facebook, Image>();

/**
 * Converts a Base64 string to an image file and returns the file path.
 * @param blob The blob to convert.
 * @returns The path to the temp image file.
 */
export function blobPath(blob: ImageBlob): string {
  if (
    blob.extension === undefined ||
    supportedImageExtensions.includes(blob.extension) === false
  ) {
    throw new PostError(
      `Blob specified is not a supported image. Supported extensions are: ${supportedImageExtensions.join(
        ", "
      )}`
    );
  }
  const tempFile = tmp.fileSync({ postfix: `.${blob.extension}` });
  const buffer = Buffer.from(blob.data, "base64");
  const uint8 = new Uint8Array(
    buffer.buffer,
    buffer.byteOffset,
    buffer.byteLength
  );
  fs.writeFileSync(tempFile.name, uint8);
  return tempFile.name;
}

/**
 * A class representing an uploaded image.
 * @property {string} id - The ID of the image.
 */
export class Image {
  id: string;
  constructor(image: ImageResponse, config: UploadConfig, facebook: Facebook) {
    this.id = image.id;
    clientInstances.set(facebook, this);
  }
}

/**
 * Class for uploading media to Facebook.
 * Provides methods for uploading images, videos, and other media types.
 * You can use this class to upload media to Facebook, but your probably shouldn't access it directly.
 * Instead, access it through the {@link Facebook} class.
 * @see {@link Facebook["upload"]}
 * @see {@link Facebook["client"]}
 */
export class Upload {
  constructor(private readonly facebook: Facebook) {}

  /**
   * Upload an image to Facebook.
   * @param config.media - The path to the image file to upload.
   * @param profile - The profile to upload the image to. This defaults to the profile set in the {@link Facebook} class — you probably shouldn't change this.
   * @param credentials - The credentials to use for uploading the image. This defaults to the credentials set in the {@link Facebook} class — you probably shouldn't change this.
   * @param permissions - The permissions to use for uploading the image.
   * @returns A promise that resolves to an array of image responses.
   */
  async image(
    config: UploadConfig,
    profile: Profile = this.facebook.profile,
    credentials: string[] = profile === "page" ? ["pageToken"] : ["userToken"],
    permissions: string[] = profile === "page" ? [] : []
  ): Promise<ImageResponse[]> {
    return this.facebook.refresh(credentials, permissions).then(async () => {
      const token = t(profile, this.facebook);

      const file = (path: string): Promise<ImageResponse> => {
        if (fs.existsSync(path) === false) {
          throw new PostError(
            `File specified at path '${path}' does not exist, cannot upload photo.`
          );
        }

        const extension = path.split(".").pop();
        if (
          extension === undefined ||
          supportedImageExtensions.includes(extension) === false
        ) {
          throw new PostError(
            `File specified at path '${path}' is not a supported image. Supported extensions are: ${supportedImageExtensions.join(
              ", "
            )}`
          );
        }

        const form = new FormData();
        const image = fs.readFileSync(path);
        const name = path.split("/").pop();
        const blob = new Blob([image], { type: `image/${extension}}` });
        assert(token, "Token is missing.");

        form.append("access_token", token);
        form.append("source", blob, name);
        form.append("published", "false");
        form.append("temporary", "true");

        return new Promise((resolve) => {
          try {
            resolve(
              this.facebook.client
                .post(`me/photos`, form, {})
                .then((data: ImageResponse) => data)
            );
          } catch (error) {
            throw new PostError("Error uploading photo.", error);
          }
        });
      };

      const paths = (
        Array.isArray(config.media) ? config.media : [config.media]
      ).map((m) => {
        if (typeof m === "object" && "data" in m && "type" in m) {
          return blobPath(m);
        } else {
          return m as string;
        }
      });
      const promises = paths.map((path) => file(path));

      return Promise.all(promises)
        .then((images: ImageResponse[]) => {
          return images.map((image) => new Image(image, config, this.facebook));
        })
        .catch((e: PostError) => {
          throw new PostError("Error uploading media.", e);
        });
    });
  }
}
