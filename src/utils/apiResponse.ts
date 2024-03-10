class apiResponse {
  success: boolean;
  constructor(
    public statusCode: number,
    public data: any,
    public message = "Success"
  ) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

export { apiResponse };
