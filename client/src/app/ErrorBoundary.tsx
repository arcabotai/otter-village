import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: 20,
          textAlign: 'center',
          background: '#1a1a2e',
          color: '#f0f0f0',
          fontFamily: 'system-ui',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🦦💥</div>
          <h2 style={{ marginBottom: 8 }}>Something went wrong</h2>
          <p style={{ color: '#a0a0b0', marginBottom: 20, maxWidth: 400 }}>
            {this.state.error?.message ?? 'An unexpected error occurred'}
          </p>
          <button
            className="btn"
            onClick={this.handleRetry}
            style={{ padding: '10px 24px', fontSize: 15 }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
