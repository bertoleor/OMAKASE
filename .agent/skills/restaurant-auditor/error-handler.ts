export type ErrorSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export class AppError extends Error {
  public readonly code: string;
  public readonly severity: ErrorSeverity;
  public readonly timestamp: string;

  constructor(
    message: string,
    code: string,
    severity: ErrorSeverity = "MEDIUM",
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.severity = severity;
    this.timestamp = new Date().toISOString();
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const isAppError = (error: unknown): error is AppError => {
  return error instanceof AppError;
};
