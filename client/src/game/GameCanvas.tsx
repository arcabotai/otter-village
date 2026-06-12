import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { World } from './components/World';
import { LocalPlayer } from './components/Player';
import { RemotePlayers } from './components/RemotePlayers';
import { GameCamera } from './controllers/GameCamera';
import { Lighting } from './world/Lighting';
import { Sky } from './world/Sky';
import { HUD } from './ui/HUD';
import { ChatPanel } from './ui/ChatPanel';
import { EmoteMenu } from './ui/EmoteMenu';
import { SettingsMenu } from './ui/SettingsMenu';
import { PlayerList } from './ui/PlayerList';
import { VirtualJoystick } from './input/VirtualJoystick';
import { InputManager } from './input/InputManager';
import { useSettingsStore } from '../state/settingsStore';
import { useChatStore } from '../state/chatStore';

export function GameCanvas() {
  const dpr = useSettingsStore((s) => s.dpr);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas
        shadows={false}
        dpr={[1, Math.min(dpr, 1.5)]}
        camera={{ fov: 55, near: 0.1, far: 250 }}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <Physics gravity={[0, -20, 0]} timeStep={1 / 60}>
            <World />
            <LocalPlayer />
            <RemotePlayers />
          </Physics>
        </Suspense>
        <GameCamera />
        <Lighting />
        <Sky />
      </Canvas>

      {/* UI Overlays */}
      <InputManager />
      <HUD />
      <ChatPanel />
      <EmoteMenu />
      <SettingsMenu />
      <PlayerList />
      <VirtualJoystick />
    </div>
  );
}
