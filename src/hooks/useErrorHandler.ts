"use client";

import { useState, useCallback } from "react";
import { logError, logWarn } from "@/lib/logger";

export interface ErrorState {
  message: string;
  code?: string;
  details?: unknown;
}

export interface UseErrorHandlerReturn {
  error: ErrorState | null;
  isError: boolean;
  setError: (error: ErrorState | null) => void;
  handleError: (error: unknown, fallbackMessage?: string) => void;
  clearError: () => void;
}

/**
 * Reusable hook for handling errors in components.
 * Replaces repetitive try/catch patterns.
 * 
 * @example
 * const { error, handleError, clearError } = useErrorHandler();
 * 
 * async function fetchData() {
 *   try {
 *     const data = await api.fetch();
 *   } catch (e) {
 *     handleError(e, "Failed to load data");
 *   }
 * }
 */
export function useErrorHandler(defaultMessage = "An error occurred"): UseErrorHandlerReturn {
  const [error, setError] = useState<ErrorState | null>(null);

  const isError = error !== null;

  const handleError = useCallback(
    (err: unknown, fallbackMessage?: string) => {
      let errorMessage = defaultMessage;
      let errorCode: string | undefined;
      let errorDetails: unknown;

      if (err instanceof Error) {
        errorMessage = err.message || fallbackMessage || defaultMessage;
        
        // Extract Supabase error details
        const supabaseError = err as { code?: string; details?: string };
        if (supabaseError.code) {
          errorCode = supabaseError.code;
        }
        if (supabaseError.details) {
          errorDetails = supabaseError.details;
        }

        // Log to centralized logger
        logError(err.message, err, {
          component: "useErrorHandler",
          errorCode,
        });
      } else if (typeof err === "string") {
        errorMessage = err;
        logWarn(err, { component: "useErrorHandler" });
      } else if (fallbackMessage) {
        errorMessage = fallbackMessage;
        logWarn(fallbackMessage, { component: "useErrorHandler" });
      }

      setError({
        message: errorMessage,
        code: errorCode,
        details: errorDetails,
      });
    },
    [defaultMessage]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    isError,
    setError,
    handleError,
    clearError,
  };
}

/**
 * Hook specifically for handling async operations with loading state
 */
export function useAsyncHandler<T>(
  asyncFn: () => Promise<T>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    defaultErrorMessage?: string;
  }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const { error, handleError, clearError } = useErrorHandler(
    options?.defaultErrorMessage || "Operation failed"
  );

  const execute = useCallback(async () => {
    clearError();
    setLoading(true);

    try {
      const result = await asyncFn();
      setData(result);
      options?.onSuccess?.(result);
      return result;
    } catch (err) {
      handleError(err);
      options?.onError?.(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [asyncFn, handleError, clearError, options]);

  return {
    data,
    loading,
    error,
    execute,
    clearError,
  };
}
