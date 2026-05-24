import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  // eslint-disable-next-line no-unused-vars
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', background: '#fee2e2', borderRadius: '12px', color: '#991b1b', fontFamily: 'monospace' }}>
          <h2>💥 Component Crashed!</h2>
          <p style={{ fontWeight: 'bold' }}>{this.state.error && this.state.error.toString()}</p>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>
            <summary>Click to view stack trace</summary>
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <p style={{ marginTop: '20px' }}>Please copy this exact error message and send it to me!</p>
        </div>
      );
    }
    return this.props.children;
  }
}
