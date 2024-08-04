import { GraphError } from "../errors";

const FACEBOOK_GRAPH_API = "https://graph.facebook.com/v20.0";

export default class Client {
  url: string = FACEBOOK_GRAPH_API;
  constructor(url: string = this.url) {
    this.url = url;
  }

  async get(path: string, params: any = {}) {
    return fetch(
      `${this.url}/${path}${
        params ? "?" + new URLSearchParams(params).toString() : ""
      }`
    ).then(async (r) => {
      const data = await r.json();
      if (r.ok) {
        return data;
      } else {
        const error = new Error(r.statusText);
        throw new GraphError(r, data, error);
      }
    });
  }

  async post(path: string, body: any) {
    return fetch(`${this.url}/${path}`, {
      method: "POST",
      body: JSON.stringify(body),
    }).then(async (r) => {
      const data = await r.json();
      if (r.ok) {
        return data;
      } else {
        const error = new Error(r.statusText);
        throw new GraphError(r, data, error);
      }
    });
  }
}
