import React from "react";

interface State {
  error: Error | null;
}

interface Props {
  children: React.ReactNode;
}

/**
 * ErrorBoundary — catches runtime render errors and shows them
 * instead of a blank black screen. This reveals the actual crash
 * message in the browser for debugging.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#0a0e1a",
            color: "#f87171",
            fontFamily: "monospace",
            fontSize: "13px",
            padding: "24px",
            overflowY: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            zIndex: 9999,
          }}
        >
          <strong style={{ fontSize: "16px", color: "#fca5a5" }}>
            Runtime Error — {this.state.error.name}
          </strong>
          {"\n\n"}
          {this.state.error.message}
          {"\n\n"}
          {this.state.error.stack}
        </div>
      );
    }
    return this.props.children;
  }
}
