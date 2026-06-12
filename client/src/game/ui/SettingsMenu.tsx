import { useUIStore } from '../../state/uiStore';
import { useSettingsStore } from '../../state/settingsStore';

export function SettingsMenu() {
  const showSettings = useUIStore((s) => s.showSettings);
  const toggleSettings = useUIStore((s) => s.toggleSettings);
  const quality = useSettingsStore((s) => s.quality);
  const muteChat = useSettingsStore((s) => s.muteChat);
  const setQuality = useSettingsStore((s) => s.setQuality);
  const toggleMute = useSettingsStore((s) => s.toggleMute);

  if (!showSettings) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)',
      zIndex: 50,
      fontFamily: 'system-ui',
    }} onClick={toggleSettings}>
      <div
        className="glass"
        style={{
          padding: '24px 28px',
          width: 300,
          maxWidth: '90vw',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}>
          <span style={{ fontWeight: 600, fontSize: 16 }}>⚙️ Settings</span>
          <button
            onClick={toggleSettings}
            style={{
              background: 'none',
              border: 'none',
              color: '#a0a0b0',
              fontSize: 18,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Quality */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, color: '#a0a0b0', display: 'block', marginBottom: 8 }}>
            Quality
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['low', 'medium', 'high'] as const).map((q) => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  border: quality === q
                    ? '2px solid var(--color-primary)'
                    : '2px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  background: quality === q
                    ? 'rgba(126, 200, 227, 0.15)'
                    : 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  fontFamily: 'system-ui',
                  fontSize: 13,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Mute Chat */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: 14 }}>Mute Chat</span>
          <button
            onClick={toggleMute}
            style={{
              width: 48,
              height: 28,
              borderRadius: 14,
              border: 'none',
              background: muteChat ? 'var(--color-primary)' : 'rgba(255,255,255,0.15)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.2s',
            }}
          >
            <div style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: '#fff',
              position: 'absolute',
              top: 3,
              left: muteChat ? 23 : 3,
              transition: 'left 0.2s',
            }} />
          </button>
        </div>
      </div>
    </div>
  );
}
