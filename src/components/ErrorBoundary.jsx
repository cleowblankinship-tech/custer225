import { Component } from 'react'

// Without this, any uncaught render error unmounts the whole tree and the
// user is left with a blank screen. Show the message so it can be diagnosed.
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[225] render crash:', error, info?.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    return (
      <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', color: '#333' }}>
        <h2 style={{ margin: '0 0 8px' }}>Something went wrong</h2>
        <p style={{ margin: '0 0 12px', fontSize: 14 }}>{String(error?.message || error)}</p>
        <pre style={{ fontSize: 11, whiteSpace: 'pre-wrap', opacity: 0.7 }}>
          {String(error?.stack || '').split('\n').slice(0, 6).join('\n')}
        </pre>
        <button onClick={() => window.location.reload()} style={{ padding: '8px 16px', fontSize: 14 }}>
          Reload
        </button>
      </div>
    )
  }
}
