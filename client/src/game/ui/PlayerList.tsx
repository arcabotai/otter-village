import { useMemo } from 'react';
import type { Species } from '@otter-village/shared';
import { useWorldStore } from '../../state/worldStore';
import { useUIStore } from '../../state/uiStore';

const SPECIES_EMOJIS: Record<Species, string> = {
  otter: '🦦',
  cat: '🐱',
  dog: '🐶',
  bunny: '🐰',
  bear: '🐻',
  fox: '🦊',
  penguin: '🐧',
  deer: '🦌',
};

export function PlayerList() {
  const showPlayerList = useUIStore((s) => s.showPlayerList);
  const remotePlayers = useWorldStore((s) => s.remotePlayers);
  const togglePlayerList = useUIStore((s) => s.togglePlayerList);

  const players = useMemo(() => {
    const list: Array<{ id: string; name: string; species: Species }> = [];
    remotePlayers.forEach((p, id) => {
      list.push({
        id,
        name: p.displayName,
        species: p.appearance.species,
      });
    });
    return list;
  }, [remotePlayers]);

  if (!showPlayerList) return null;

  return (
    <div
      className="glass"
      style={{
        position: 'absolute',
        top: 56,
        left: 16,
        width: 220,
        maxHeight: '60vh',
        overflowY: 'auto',
        zIndex: 30,
        fontFamily: 'system-ui',
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>
          👥 Players ({players.length + 1})
        </span>
        <button
          onClick={togglePlayerList}
          style={{
            background: 'none',
            border: 'none',
            color: '#a0a0b0',
            fontSize: 16,
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>
      <div style={{ padding: '8px 14px' }}>
        <div style={{
          padding: '6px 0',
          fontSize: 13,
          color: '#7ec8e3',
          fontWeight: 600,
        }}>
          🦦 You
        </div>
        {players.map((p) => (
          <div
            key={p.id}
            style={{
              padding: '6px 0',
              fontSize: 13,
              color: '#e0e0e0',
            }}
          >
            {SPECIES_EMOJIS[p.species] ?? '🦦'} {p.name}
          </div>
        ))}
      </div>
    </div>
  );
}
