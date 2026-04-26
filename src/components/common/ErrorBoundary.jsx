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
    console.error("3D Rendering Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/50 rounded-3xl border border-rose-500/20 text-rose-400 p-10 text-center">
          <AlertCircle size={48} className="mb-4 opacity-50" />
          <h2 className="text-xl font-bold mb-2 uppercase tracking-tighter">Visualization Failed</h2>
          <p className="text-sm text-slate-500 max-w-[280px]">
             Could not initialize 3D assets. Please check your connection or GPU acceleration.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-rose-500/10 border border-rose-500/30 rounded-full text-xs font-bold hover:bg-rose-500/20 transition-all"
          >
            RETRY ENGINE
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
