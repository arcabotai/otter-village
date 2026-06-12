import { useWorldStore } from '../../state/worldStore';
import { useUIStore } from '../../state/uiStore';
import { useChatStore } from '../../state/chatStore';

export function HUD() {
  const remotePlayers = useWorldStore((s) => s.remotePlayers);
  const togglePlayerList = useUIStore((s) => s.togglePlayerList);
  const toggleEmoteMenu = useUIStore((s) => s.toggleEmoteMenu);
  const toggleSettings = useUIStore((s) => s.toggleSettings);
  const toggleChat = useChatStore((s) => s.toggleChat);

  const playerCount = remotePlayers.size + 1; // +1 for local

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      fontFamily: 'system-ui',
      zIndex: 10,
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '12px 16px',
        pointerEvents: 'auto',
      }}>
        {/* Left: Player count / list toggle */}
        <button
          className="glass-sm"
          onClick={togglePlayerList}
          style={{
            padding: '8px 14px',
            cursor: 'pointer',
            color: '#fff',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            border: 'none',
            fontFamily: 'system-ui',
            pointerEvents: 'auto',
          }}
        >
          <span>👥</span>
          <span>{playerCount}</span>
        </button>

        {/* Right: Settings */}
        <button
          className="glass-sm"
          onClick={toggleSettings}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            color: '#fff',
            fontSize: 18,
            border: 'none',
            fontFamily: 'system-ui',
            pointerEvents: 'auto',
          }}
        >
          ⚙️
        </button>
      </div>

      {/* Bottom right: Chat + Emote */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'auto',
      }}>
        <button
          className="glass"
          onClick={toggleEmoteMenu}
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            cursor: 'pointer',
            border: 'none',
            color: '#fff',
            pointerEvents: 'auto',
          }}
        >
          😊
        </button>
        <button
          className="glass"
          onClick={toggleChat}
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            cursor: 'pointer',
            border: 'none',
            color: '#fff',
            pointerEvents: 'auto',
          }}
        >
          💬
        </button>
      </div>
    </div>
  );
}
