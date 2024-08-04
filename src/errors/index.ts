// Some really janky error handling here
// I'm not sure what the best way to handle this is, but I'm pretty sure this isn't it

export class GraphError extends Error {
  status: number;
  response: Response;
  data: any;
  constructor(response: Response, data: any, error: any = null) {
    const message = response?.statusText || "Graph API Error";
    const e = new Error(message);
    super(message);

    if (data) {
      data.url = response.url;
      data.status = response.status;
    }

    this.data = data;
    this.cause = error ? error.cause : e.cause;
    this.stack = error ? error.stack : e.stack;

    this.response = response;
    this.status = data?.error?.code || response.status;

    this.name = "GraphError";
    this.message = `${message}\n${JSON.stringify(data, null, 2)}`;
  }
}

export class CredentialError extends GraphError {
  constructor(message: string, error: any = null, response: any = null) {
    super(response.response, response.data, error);
    this.message = `${error.message}\n${message}`;
    this.name = "CredentialError";
  }
}

export class UnauthorizedError extends GraphError {
  constructor(message: string, error: any) {
    super(error.response, error.data, error);
    this.message = `${error.message}\n${message}`;
    this.name = "UnauthorizedError";
  }
}
