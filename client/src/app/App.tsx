import { ErrorBoundary } from './ErrorBoundary';
import { GameCanvas } from '../game/GameCanvas';
import { LoginScreen } from '../game/ui/LoginScreen';
import { useConnectionStore } from '../state/connectionStore';
import { useUIStore } from '../state/uiStore';
import { SocketManager } from '../game/network/SocketManager';

export function App() {
  const status = useConnectionStore((s) => s.status);
  const showLogin = useUIStore((s) => s.showLogin);

  return (
    <ErrorBoundary>
      <SocketManager />
      {showLogin || status !== 'connected' ? (
        <LoginScreen />
      ) : (
        <GameCanvas />
      )}
    </ErrorBoundary>
  );
}
