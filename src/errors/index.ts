// Some really janky error handling here
// I'm not sure what the best way to handle this is, but I'm pretty sure this isn't it

export class GraphError extends Error {
  status: number;
  response: Response;
  data: any;
  constructor(error: any, response: Response, data: any) {
    const message = response?.statusText || "";
    const e = new Error(message);
    super(message);

    if (data) {
      data.url = response?.url;
      data.status = response?.status;
      if (response.body) {
        data.body = response.body;
      }
    }

    this.data = data;
    this.response = response;
    this.status = data?.error?.code || response?.status;
    this.name = "GraphError";

    if (error && error.stack) {
      const currentStack = this.stack || "";
      const firstLine = currentStack.split("\n")[0];
      this.stack = `${firstLine}\n${error.stack
        .split("\n")
        .slice(1)
        .join("\n")}`;
    }

    this.cause = error;
    this.message =
      message || data
        ? `${message || ""}\n${JSON.stringify(data, null, 2) || ""}`
        : "";
  }
}

export class CredentialError extends GraphError {
  constructor(message: string = "", error: any = {}, api: any = {}) {
    super(error, api?.response, api?.data);
    console.error(
      message +
        "\nTry logging in again.\nThe command you probably need to use is `npx facebook refresh`.\n"
    );
    this.name = "CredentialError";
  }
}

export class PostError extends GraphError {
  constructor(message: string = "", error: any = {}, api: any = {}) {
    super(error, api?.response, api?.data);
    this.message = `${this.message} ${message}`;
    this.name = "PostError";
  }
}
export class UnauthorizedError extends CredentialError {
  constructor(...args: any) {
    super(...args);
    this.name = "UnauthorizedError";
  }
}

export class DeprecatedError extends GraphError {
  constructor(message: string = "", error: any = {}, api: any = {}) {
    super(error, api?.response, api?.data);
    this.message = `${this.message} ${message}`;
    this.name = "DeprecatedError";
  }
}

export class FileError extends Error {
  constructor(message: string = "", error: any = {}) {
    super(message);
    this.name = "FileError";
    this.message =
      error && Object.keys(error).length > 0
        ? `File Error: ${message}\n${JSON.stringify(error, null, 2)}`
        : `File Error: ${message}`;

    if (error && error.stack) {
      const currentStack = this.stack || "";
      const firstLine = currentStack.split("\n")[0];
      this.stack = `${firstLine}\n${error.stack
        .split("\n")
        .slice(1)
        .join("\n")}`;
    }
    this.cause = error;
  }
}

export function warnConsole(message: string) {
  console.warn(`[Warning] ${message}`);
}
