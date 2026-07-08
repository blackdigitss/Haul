import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("App crashed:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-center">
          <p className="font-display text-2xl text-foreground">Something broke.</p>
          <button
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
            onClick={() => window.location.reload()}
          >
            Reload the app
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
