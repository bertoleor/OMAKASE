"use client";

import { Component, ReactNode, useState } from "react";
import { logError } from "@/lib/logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch React errors.
 as wrapper * Use for components that might crash.
 * 
 * @example
 * <ErrorBoundary componentName="BookingWizard">
 *   <BookingWizard />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log to centralized logger
    logError(error.message, error, {
      component: this.props.componentName || "ErrorBoundary",
      errorInfo: errorInfo.componentStack,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback
      return (
        <div className="flex min-h-[200px] items-center justify-center p-8">
          <div className="text-center">
            <h2 className="mb-2 text-xl font-semibold text-white">
              Something went wrong
            </h2>
            <p className="mb-4 text-gray-400">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="rounded-lg bg-white/10 px-4 py-2 text-white transition-colors hover:bg-white/20"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook to use ErrorBoundary functionality in function components
 * (for cases where you can't use the class component)
 */
export function useErrorBoundary() {
  const [error, setError] = useState<Error | null>(null);

  const resetError = () => setError(null);

  if (error) {
    throw error;
  }

  return { setError, resetError };
}
