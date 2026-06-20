'use client';

// Last-resort boundary for an error thrown in the root layout itself. It must
// render its own <html>/<body> since the layout failed.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 18,
            padding: 24,
            textAlign: 'center',
            background: '#0b0e0a',
            color: '#f3e6c8',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div style={{ fontSize: 40 }}>🪔</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#f0c869' }}>Something went dark</h1>
          <p style={{ maxWidth: 360, fontSize: 14, lineHeight: 1.5, color: 'rgba(243,230,200,0.7)', margin: 0 }}>
            The game hit an unexpected error. Your progress is saved.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => reset()}
              style={{
                borderRadius: 12,
                border: '1px solid rgba(240,200,105,0.5)',
                background: 'rgba(240,200,105,0.2)',
                color: '#f5e9c8',
                padding: '10px 22px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ▸ Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(255,255,255,0.06)',
                color: 'rgba(243,230,200,0.85)',
                padding: '10px 22px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ⟳ Reload
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
