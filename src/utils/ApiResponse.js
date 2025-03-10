class ApiResponse {
  constructor(statusCode, data, message) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode <= 200;
  }

  toJSON() {
    return {
      status: this.statusCode,
      data: this.data,
      message: this.message,
      success: this.success,
    };
  }
}

export { ApiResponse };
