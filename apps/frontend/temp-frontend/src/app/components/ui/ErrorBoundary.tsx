'use client';

import React from 'react';

interface Props { children: React.ReactNode; fallback?: React.ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
    // Sentry hook point: Sentry.captureException(error, { extra: info });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center px-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-white font-semibold text-lg">Ceva n-a mers bine</h2>
          <p className="text-gray-500 text-sm max-w-sm">
            {this.state.error?.message ?? 'Eroare necunoscută'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm hover:bg-brand-500 transition-colors"
          >
            Încearcă din nou
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
