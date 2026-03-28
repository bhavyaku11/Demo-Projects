import { Component, type ErrorInfo, type PropsWithChildren, type ReactNode } from "react";

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false
  };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return {
      hasError: true
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[frontend:error-boundary]", error, errorInfo);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
          <div className="w-full max-w-xl rounded-[32px] border border-white/10 bg-white/[0.05] p-8 shadow-[0_28px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300/75">Application Error</p>
            <h1 className="mt-4 text-3xl font-semibold text-white">The interface hit an unexpected state.</h1>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              The error boundary contained the failure and kept the rest of the application from crashing.
              Refresh the page to recover.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-sm font-medium text-cyan-100 transition-all duration-300 hover:border-cyan-300/40 hover:bg-cyan-400/15 hover:text-white"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

