import { GraphError } from "../errors";

export const FACEBOOK_GRAPH_API = "https://graph.facebook.com/v20.0";

export interface Response {
  response: Response;
  data: any;
}

class Queue {
  _items: any[];

  constructor() {
    this._items = [];
  }
  enqueue(item: any) {
    this._items.push(item);
  }
  dequeue() {
    return this._items.shift();
  }
  get size() {
    return this._items.length;
  }
}

export default class Client extends Queue {
  url: string;
  _pendingPromise: boolean;

  constructor(url: string = FACEBOOK_GRAPH_API) {
    super();
    this._pendingPromise = false;
    this.url = url;
  }

  enqueue(action: Function) {
    return new Promise((resolve, reject) => {
      super.enqueue({ action, resolve, reject });
      this.dequeue();
    });
  }

  async dequeue() {
    if (this._pendingPromise) return false;

    let item = super.dequeue();

    if (!item) return false;

    try {
      this._pendingPromise = true;

      let payload = await item.action(this);

      this._pendingPromise = false;
      item.resolve(payload);
    } catch (e) {
      this._pendingPromise = false;
      item.reject(e);
    } finally {
      this.dequeue();
    }

    return true;
  }

  wait(ms: number) {
    const helper = () => new Promise((resolve) => setTimeout(resolve, ms));
    return this.enqueue(helper);
  }

  get(path: string, params: any = {}): any {
    const helper = () =>
      new Promise(async (resolve, reject) => {
        const url = `${this.url}/${path}${
          params ? "?" + new URLSearchParams(params).toString() : ""
        }`;
        const response = await fetch(url).then(async (r: any) => {
          const data = await r.json();
          if (r.ok) {
            return data;
          } else {
            const error = new Error(r.statusText);
            const graph = new GraphError(error, r, data);
            reject(graph);
          }
        });
        resolve(response);
      });
    return this.enqueue(helper);
  }

  post(path: string, body: Object) {
    const helper = () =>
      new Promise(async (resolve, reject) => {
        const response = await fetch(`${this.url}/${path}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }).then(async (r) => {
          const data = await r.json();
          if (r.ok) {
            return data;
          } else {
            const error = new Error(r.statusText);
            const graph = new GraphError(error, r, data);
            reject(graph);
          }
        });
        resolve(response);
      });
    return this.enqueue(helper);
  }
}
