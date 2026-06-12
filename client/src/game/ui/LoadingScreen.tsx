export function LoadingScreen() {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#1a1a2e',
      color: '#f0f0f0',
      fontFamily: 'system-ui',
      zIndex: 1000,
    }}>
      <div style={{ fontSize: 72, marginBottom: 20 }}>🦦</div>
      <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>
        Otter Village
      </div>
      <div style={{ fontSize: 16, color: '#a0a0b0' }}>
        Loading
        <span style={{ animation: 'dots 1.5s infinite' }}>...</span>
      </div>
      <style>{`
        @keyframes dots {
          0%, 20% { content: ''; }
          40% { content: '.'; }
          60% { content: '..'; }
          80%, 100% { content: '...'; }
        }
      `}</style>
    </div>
  );
}
