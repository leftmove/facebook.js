import { GraphError } from "../errors";

const FACEBOOK_GRAPH_API = "https://graph.facebook.com/v20.0";

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

  get(path: string, params: any = {}): any {
    const helper = () =>
      new Promise(async (resolve) => {
        const response = await fetch(
          `${this.url}/${path}${
            params ? "?" + new URLSearchParams(params).toString() : ""
          }`
        ).then(async (r: any) => {
          const data = await r.json();
          if (r.ok) {
            return data;
          } else {
            const error = new Error(r.statusText);
            throw new GraphError(error, r, data);
          }
        });
        resolve(response);
      });
    return this.enqueue(helper);
  }

  post(path: string, body: any) {
    return this.enqueue(() =>
      fetch(`${this.url}/${path}`, {
        method: "POST",
        body: JSON.stringify(body),
      }).then(async (r) => {
        const data = await r.json();
        if (r.ok) {
          return data;
        } else {
          const error = new Error(r.statusText);
          throw new GraphError(error, r, data);
        }
      })
    );
  }
}
