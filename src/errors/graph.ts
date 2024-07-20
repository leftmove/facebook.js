class GraphError extends Error {
  status: number = 400;
  constructor(response: Object, status: any = 400) {
    super(JSON.stringify(response));
    this.name = "FacebookGraphError";
    this.status = status;
  }
}
