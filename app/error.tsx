'use client';

// Route-level error boundary. Without this, a failed/corrupt GLTF load (or a
// WebGL context loss) thrown out of the 3D canvas would unmount the whole tree
// to a permanent black screen with no recovery. Here it catches the throw and
// offers a way back instead.
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
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
        background: 'radial-gradient(120% 90% at 50% 0%, #1a130c 0%, #0b0e0a 70%)',
        color: '#f3e6c8',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ fontSize: 40 }}>🪔</div>
      <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#f0c869' }}>Something went dark</h1>
      <p style={{ maxWidth: 360, fontSize: 14, lineHeight: 1.5, color: 'rgba(243,230,200,0.7)', margin: 0 }}>
        A part of the world failed to load. Your progress is saved — try again, or reload to relight the lantern.
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
  );
}
