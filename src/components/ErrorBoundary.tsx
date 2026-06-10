import { Component, type ReactNode } from "react";
import "../styles/errorboundary.css";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// React error boundaries require a class component — no hook equivalent exists
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    console.error("[ErrorBoundary]", error);
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="error-boundary flex items-center justify-center h-full p-6">
        <div className="glass error-boundary-card flex flex-col items-center gap-3 text-center">
          <span className="error-boundary-title font-bold">Something went wrong</span>
          <span className="error-boundary-body text-sm">
            Reload the app to keep following the action.
          </span>
          <button
            className="glass error-boundary-btn font-semibold"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
