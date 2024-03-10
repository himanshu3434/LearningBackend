class apiError extends Error {
  data: null;
  success: boolean;
  errors;
  constructor(
    public statusCode: number,
    message = "something went wrong ",
    errors = [],
    statck = ""
  ) {
    super(message);

    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (statck) {
      this.stack = statck;
    } else Error.captureStackTrace(this, this.constructor);
  }
}
export { apiError };
