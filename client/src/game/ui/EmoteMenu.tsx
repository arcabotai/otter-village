import type { EmoteId } from '@otter-village/shared';
import { EMOTE_DEFS } from '@otter-village/shared';
import { useUIStore } from '../../state/uiStore';
import { useConnectionStore } from '../../state/connectionStore';

export function EmoteMenu() {
  const showEmoteMenu = useUIStore((s) => s.showEmoteMenu);
  const toggleEmoteMenu = useUIStore((s) => s.toggleEmoteMenu);

  if (!showEmoteMenu) return null;

  const entries = Object.entries(EMOTE_DEFS) as [EmoteId, typeof EMOTE_DEFS[EmoteId]][];

  function handleEmote(emoteId: EmoteId) {
    const socket = useConnectionStore.getState().socket;
    if (socket) {
      socket.emit('event', { type: 'Emote', emoteId });
    }
    toggleEmoteMenu();
  }

  return (
    <div
      className="glass"
      style={{
        position: 'absolute',
        bottom: 100,
        right: 20,
        padding: 16,
        zIndex: 40,
        fontFamily: 'system-ui',
      }}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 8,
      }}>
        {entries.map(([id, def]) => (
          <button
            key={id}
            onClick={() => handleEmote(id)}
            style={{
              width: 52,
              height: 52,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              border: 'none',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.08)',
              cursor: 'pointer',
              color: '#fff',
              fontFamily: 'system-ui',
              fontSize: 10,
              transition: 'background 0.1s',
            }}
            title={def.label}
          >
            <span style={{ fontSize: 24 }}>{def.emoji}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
