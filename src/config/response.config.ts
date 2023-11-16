export class FailedResponse {
  private message: string | undefined;

  constructor(message: string) {
    this.message = message;
  }

  toString() {
    return { success: false, message: this.message };
  }
}
