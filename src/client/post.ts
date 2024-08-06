import { Facebook } from "./client";

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
   * @see {@link Facebook["removePost"]}
   * @extends {Facebook["removePost"]}
   **/
  remove() {
    return this.client.removePost({ id: this.id });
  }

  /**
   * @see {@link Facebook["editPost"]}
   * @param message - The new message for the post.
   * @extends {Facebook["editPost"]}
   **/
  edit(message: string) {
    return this.client.editPost({ id: this.id, message });
  }
}
