import { useMemo } from 'react';
import type { PlayerSnapshot } from '@otter-village/shared';
import { useWorldStore } from '../../state/worldStore';
import { usePlayerStore } from '../../state/playerStore';
import { RemotePlayer } from './RemotePlayer';

export function RemotePlayers() {
  const remotePlayers = useWorldStore((s) => s.remotePlayers);
  const localPlayerId = usePlayerStore((s) => s.localPlayerId);

  const entries = useMemo(() => {
    const result: Array<{ id: string; snapshot: PlayerSnapshot }> = [];
    remotePlayers.forEach((snapshot, id) => {
      if (id !== localPlayerId) {
        result.push({ id, snapshot });
      }
    });
    return result;
  }, [remotePlayers, localPlayerId]);

  return (
    <>
      {entries.map(({ id, snapshot }) => (
        <RemotePlayer key={id} snapshot={snapshot} />
      ))}
    </>
  );
}
