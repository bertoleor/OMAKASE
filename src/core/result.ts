export type ErrorCode =
  | "VALIDATION_ERROR"
  | "DATABASE_ERROR"
  | "PAYMENT_FAILED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export type Result<T> =
  | { success: true; data: T; traceId: string }
  | {
      success: false;
      error: { code: ErrorCode; message: string; details?: unknown };
      traceId: string;
    };

export const Success = <T>(data: T, traceId: string): Result<T> => ({
  success: true,
  data,
  traceId,
});

export const Failure = (
  code: ErrorCode,
  message: string,
  traceId: string,
  details?: unknown,
): Result<never> => ({
  success: false,
  error: { code, message, details },
  traceId,
});
