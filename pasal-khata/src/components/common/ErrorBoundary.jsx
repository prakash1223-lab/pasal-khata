import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center">
        <span className="text-5xl mb-4">⚠️</span>
        <h1 className="text-lg font-bold text-gray-800 mb-2">Something went wrong</h1>
        <p className="text-sm text-gray-500 mb-6 max-w-[280px]">
          {this.state.error?.message ?? 'An unexpected error occurred.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-[#1a56db] text-white text-sm font-semibold px-6 py-3 rounded-xl"
        >
          Reload Page
        </button>
      </div>
    );
  }
}
