import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in route:', error, errorInfo);

    // Auto-recover from stale chunk load errors after new Vercel deployments
    const isChunkLoadError = 
      error.message?.includes('dynamically imported module') ||
      error.message?.includes('Loading chunk') ||
      error.name === 'ChunkLoadError' ||
      error.message?.includes('Unexpected token');

    if (isChunkLoadError) {
      const storageKey = 'auto_recovered_chunk_' + window.location.pathname;
      if (!sessionStorage.getItem(storageKey)) {
        sessionStorage.setItem(storageKey, 'true');
        console.warn('Stale chunk detected after deployment. Auto-reloading page...');
        window.location.reload();
      }
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-5 shadow-[0_0_30px_rgba(244,63,94,0.15)]">
            <AlertCircle size={28} />
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-2">
            Unable to load this section
          </h2>

          <p className="text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
            A temporary version mismatch or resource error occurred after a recent update. Refreshing the app will resolve it.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-zinc-950 text-xs font-bold hover:bg-zinc-200 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Reload App</span>
            </button>

            <button
              onClick={this.handleGoHome}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-semibold active:scale-95 transition-all border border-white/10 cursor-pointer"
            >
              <Home size={14} />
              <span>Go to Home</span>
            </button>
          </div>

          {import.meta.env.DEV && this.state.error && (
            <div className="mt-8 p-3 rounded-xl bg-black/60 border border-white/10 text-left max-w-lg w-full overflow-auto text-xs font-mono text-zinc-400">
              {this.state.error.toString()}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
