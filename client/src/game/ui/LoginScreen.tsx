import { useState } from 'react';
import type { Species } from '@otter-village/shared';
import { DISPLAY_NAME_MAX_LENGTH } from '@otter-village/shared';
import { usePlayerStore } from '../../state/playerStore';
import { useUIStore } from '../../state/uiStore';
import { useConnectionStore } from '../../state/connectionStore';

const SPECIES_OPTIONS: { species: Species; emoji: string; label: string }[] = [
  { species: 'otter', emoji: '🦦', label: 'Otter' },
  { species: 'cat', emoji: '🐱', label: 'Cat' },
  { species: 'dog', emoji: '🐶', label: 'Dog' },
  { species: 'bunny', emoji: '🐰', label: 'Bunny' },
  { species: 'bear', emoji: '🐻', label: 'Bear' },
  { species: 'fox', emoji: '🦊', label: 'Fox' },
  { species: 'penguin', emoji: '🐧', label: 'Penguin' },
  { species: 'deer', emoji: '🦌', label: 'Deer' },
];

const COLOR_OPTIONS = [
  '#8B6914', '#c04040', '#40a040', '#4080c0',
  '#c070c0', '#e0a050', '#60c0c0', '#e07070',
  '#a0a0a0', '#f0c0d0', '#808040', '#c08040',
];

export function LoginScreen() {
  const [name, setName] = useState('');
  const selectedSpecies = usePlayerStore((s) => s.appearance.species);
  const selectedColor = usePlayerStore((s) => s.appearance.bodyColor);
  const setSpecies = usePlayerStore((s) => s.setSpecies);
  const setBodyColor = usePlayerStore((s) => s.setBodyColor);
  const setDisplayName = usePlayerStore((s) => s.setDisplayName);
  const setShowLogin = useUIStore((s) => s.setShowLogin);
  const status = useConnectionStore((s) => s.status);

  const canJoin = name.trim().length >= 1 && status !== 'connecting';

  function handleJoin() {
    if (!canJoin) return;
    setDisplayName(name.trim());
    setShowLogin(false);
  }

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
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      fontFamily: 'system-ui',
      zIndex: 100,
    }}>
      <div className="glass" style={{
        padding: '32px 28px',
        width: '90%',
        maxWidth: 380,
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 56, marginBottom: 4 }}>🦦</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Otter Village</h1>
          <p style={{ fontSize: 13, color: '#a0a0b0', marginTop: 4 }}>A cozy multiplayer world</p>
        </div>

        {/* Name Input */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, color: '#a0a0b0', display: 'block', marginBottom: 6 }}>
            Display Name
          </label>
          <input
            className="input"
            type="text"
            placeholder="Your name..."
            maxLength={DISPLAY_NAME_MAX_LENGTH}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            style={{ width: '100%' }}
            autoFocus
          />
        </div>

        {/* Species Selector */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, color: '#a0a0b0', display: 'block', marginBottom: 8 }}>
            Species
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
          }}>
            {SPECIES_OPTIONS.map((opt) => (
              <button
                key={opt.species}
                onClick={() => setSpecies(opt.species)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  padding: '8px 4px',
                  border: selectedSpecies === opt.species
                    ? '2px solid var(--color-primary)'
                    : '2px solid transparent',
                  borderRadius: 10,
                  background: selectedSpecies === opt.species
                    ? 'rgba(126, 200, 227, 0.15)'
                    : 'rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                  color: '#fff',
                  fontSize: 12,
                  fontFamily: 'system-ui',
                }}
              >
                <span style={{ fontSize: 28 }}>{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Color Picker */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, color: '#a0a0b0', display: 'block', marginBottom: 8 }}>
            Color
          </label>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            justifyContent: 'center',
          }}>
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                onClick={() => setBodyColor(color)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: color,
                  border: selectedColor === color
                    ? '3px solid #fff'
                    : '3px solid transparent',
                  cursor: 'pointer',
                  transition: 'transform 0.1s',
                  transform: selectedColor === color ? 'scale(1.15)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Join Button */}
        <button
          className="btn"
          onClick={handleJoin}
          disabled={!canJoin}
          style={{
            width: '100%',
            padding: '12px 20px',
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          {status === 'connecting' ? 'Connecting...' : '🐾 Join Village'}
        </button>
      </div>
    </div>
  );
}
