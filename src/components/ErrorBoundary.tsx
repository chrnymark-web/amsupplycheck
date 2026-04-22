import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) {
        return this.props.fallback;
      }

      const isDev = typeof import.meta !== "undefined" && import.meta.env?.DEV;

      return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-foreground mb-2">Something went wrong</h1>
            <p className="text-muted-foreground mb-6">
              This page failed to load. Please try reloading or go back to the homepage.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 text-sm font-medium transition-colors"
              >
                Reload Page
              </button>
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-md border border-border bg-background hover:bg-accent hover:text-accent-foreground h-10 px-6 text-sm font-medium transition-colors"
              >
                Go Home
              </a>
            </div>
            {isDev && this.state.error && (
              <details className="mt-8 text-left text-xs text-muted-foreground">
                <summary className="cursor-pointer font-mono">Error details (dev only)</summary>
                <pre className="mt-2 whitespace-pre-wrap break-all rounded-md bg-muted p-3 font-mono">
                  {this.state.error.message}
                  {this.state.error.stack ? "\n\n" + this.state.error.stack : ""}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
