import { GraphError } from "../errors";

export const FACEBOOK_GRAPH_API = "https://graph.facebook.com/v22.0";
export const FACEBOOK_URL = "https://www.facebook.com";

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
  dequeue(): any {
    return this._items.shift();
  }
  get size(): number {
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

  enqueue(action: Function): Promise<any> {
    return new Promise((resolve, reject) => {
      super.enqueue({ action, resolve, reject });
      this.dequeue();
    });
  }

  async dequeue(): Promise<boolean> {
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

  wait(ms: number): Promise<any> {
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

  post(
    path: string,
    body: string | FormData | URLSearchParams,
    headers: HeadersInit = {
      "Content-Type": "application/json",
    },
    method = "POST"
  ): any {
    const helper = () =>
      new Promise(async (resolve, reject) => {
        const response = await fetch(`${this.url}/${path}`, {
          method,
          headers,
          body,
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
    return this.enqueue(helper) as any;
  }
}

/**
 * Stringify the body of the request.
 * @param body - The body of the request.
 * @returns The JSON stringified body.
 */
export const stringify = (body: any): string => {
  return JSON.stringify(body);
};

/**
 * Convert a JSON object to URLSearchParams.
 * @param json - The JSON object to convert.
 * @returns The URLSearchParams object.
 */
export const parameterize = (json: Record<string, any>): URLSearchParams => {
  const params = new URLSearchParams();

  const appendParams = (obj: Record<string, any>, prefix = "") => {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        const paramKey = prefix ? `${prefix}[${key}]` : key;

        if (value === null || value === undefined) {
          continue;
        } else if (typeof value === "object" && !Array.isArray(value)) {
          // If value is an object, recursively process it
          appendParams(value, paramKey);
        } else if (Array.isArray(value)) {
          // Handle arrays
          value.forEach((item, index) => {
            if (typeof item === "object" && item !== null) {
              appendParams(item, `${paramKey}[${index}]`);
            } else {
              params.append(`${paramKey}[${index}]`, String(item));
            }
          });
        } else {
          params.append(paramKey, String(value));
        }
      }
    }
  };

  appendParams(json);
  return params;
};
