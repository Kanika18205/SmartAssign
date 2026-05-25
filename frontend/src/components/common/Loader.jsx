import React from 'react';

export default function Loader({ fullScreen = false, text = 'Loading...' }) {
  if (fullScreen) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'var(--bg-base)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999,
      }}>
        <div style={{ position: 'relative', width: 80, height: 80, marginBottom: 24 }}>
          {/* Outer ring */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '3px solid transparent',
            borderTopColor: 'var(--neon-cyan)',
            borderRightColor: 'var(--neon-purple)',
            animation: 'spin 1s linear infinite',
          }} />
          {/* Inner ring */}
          <div style={{
            position: 'absolute', inset: 12, borderRadius: '50%',
            border: '2px solid transparent',
            borderTopColor: 'var(--neon-green)',
            animation: 'spin 0.7s linear infinite reverse',
          }} />
          {/* Core pulse */}
          <div style={{
            position: 'absolute', inset: 26, borderRadius: '50%',
            background: 'var(--neon-cyan)',
            opacity: 0.8,
            animation: 'pulse 1s ease-in-out infinite',
          }} />
        </div>
        {/* Floating dots */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: ['var(--neon-cyan)', 'var(--neon-purple)', 'var(--neon-green)'][i],
              animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, fontFamily: 'var(--font-mono)', letterSpacing: 2 }}>
          {text}
        </p>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes pulse { 0%,100% { transform: scale(1); opacity:0.8; } 50% { transform: scale(1.3); opacity:1; } }
          @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: '3px solid var(--border)',
        borderTopColor: 'var(--neon-cyan)',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}