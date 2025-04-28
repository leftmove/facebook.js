import { i, t } from "./client";
import type { Profile } from "../api/login";
import type { Facebook } from "./client";
import { PostError } from "../errors";

import fs from "fs";
import assert from "assert";

interface UploadConfig {
  media: string | string[];
}

const supportedImageExtensions = ["jpg", "bmp", "png", "gif", "tiff"];

interface ImageResponse {
  id: string;
}

const clientInstances = new WeakMap<Facebook, Image>();

export class Image {
  id: string;
  constructor(image: ImageResponse, config: UploadConfig, facebook: Facebook) {
    this.id = image.id;
    clientInstances.set(facebook, this);
  }
}

export class Upload {
  constructor(private readonly facebook: Facebook) {}

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
      const promises = Array.isArray(config.media)
        ? config.media.map((path) => file(path))
        : [file(config.media)];

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
