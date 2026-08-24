import React from 'react';
import { AlertCircle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Application render error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-rose-200 p-10 text-center">
          <AlertCircle size={48} className="mb-4 opacity-50" />
          <h2 className="text-xl font-bold mb-2 uppercase tracking-tighter">Application Failed</h2>
          <p className="text-sm text-slate-400 max-w-[320px]">
            The app could not initialize. Refresh the page, or clear this site's saved data if the problem continues.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-rose-500/10 border border-rose-500/30 rounded-full text-xs font-bold text-rose-100 hover:bg-rose-500/20 transition-all"
          >
            REFRESH
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
