// Some really janky error handling here
// I'm not sure what the best way to handle this is, but I'm pretty sure this isn't it

export class GraphError extends Error {
  status: number;
  response: Response;
  data: any;
  constructor(error: any, response: Response, data: any) {
    const message = response?.statusText || "Graph API Error:";
    const e = new Error(message);
    super(message);

    if (data) {
      data.url = response?.url;
      data.status = response?.status;
    }

    this.data = data;
    this.cause = error ? error.cause : this.cause || e.cause;
    this.stack = error ? error.stack : this.stack || e.stack;

    this.response = response;
    this.status = data?.error?.code || response?.status;

    this.name = "GraphError";
    this.message = `${message || ""} ${JSON.stringify(data, null, 2) || ""}`;
  }
}

export class CredentialError extends GraphError {
  constructor(message: string = "", error: any = {}, api: any = {}) {
    super(error, api?.response, api?.data);
    this.message = `${this.message}${message}`;
    this.name = "CredentialError";
  }
}

export class UnauthorizedError extends GraphError {
  constructor(message: string = "", error: any, api: any = {}) {
    super(error, api?.response, api?.data);
    this.message = `${this.message}${message}`;
    this.name = "UnauthorizedError";
  }
}
