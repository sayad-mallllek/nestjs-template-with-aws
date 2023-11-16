export class FailedResponse {
  private message: string | undefined;
  private status;

  constructor(message: string, status?: number) {
    this.message = message;
    this.status = status || 400;
  }

  toString() {
    return { success: false, status: this.status, message: this.message };
  }
}

export class SuccessResponse<T = unknown> {
  private data: T;
  private status;

  constructor(data: T, status?: number) {
    this.data = data;
    this.status = status || 400;
  }

  toString() {
    return { success: false, status: this.status, data: this.data };
  }
}
