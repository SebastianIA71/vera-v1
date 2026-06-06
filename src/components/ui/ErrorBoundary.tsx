'use client';

import { Component, ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) { super(props); this.state = { hasError: false }; }

  static getDerivedStateFromError() { return { hasError: true }; }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div style={{
          padding: '16px', background: 'var(--bg2)', border: '.5px solid var(--bg4)',
          borderRadius: 12, fontFamily: 'var(--font-dm-mono)', fontSize: 11,
          letterSpacing: '.14em', color: 'var(--text3)', textAlign: 'center',
        }}>
          Esta sección no está disponible ahora.
        </div>
      );
    }
    return this.props.children;
  }
}
