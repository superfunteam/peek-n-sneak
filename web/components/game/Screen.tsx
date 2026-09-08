'use client';
import { useEffect, useRef } from 'react';
import type { GameState } from '@/game/engine';
import { drawGame, W, H } from '@/game/render';
export default function Screen({
  state,
  viewer = 0,
  attract = false,
  onTarget,
}: {
  state: GameState;
  viewer?: number;
  attract?: boolean;
  onTarget?: (x: number, y: number) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const live = useRef({ state, viewer, attract, onTarget });
  live.current = { state, viewer, attract, onTarget };
  useEffect(() => {
    let disposed = false;
    let game: import('phaser').Game | undefined;
    import('phaser').then(({ default: Phaser }) => {
      if (disposed || !host.current) return;
      class RoomScene extends Phaser.Scene {
        g!: Phaser.GameObjects.Graphics;
        displayed?: GameState['players'];
        create() {
          this.g = this.add.graphics();
          this.input.on('pointerdown', (p: Phaser.Input.Pointer) =>
            live.current.onTarget?.(p.x, p.y),
          );
        }
        update(t: number, dt: number) {
          const x = live.current;
          this.displayed = x.state.players.map((p, i) => {
            const old = this.displayed?.[i];
            if (
              !old ||
              old.room !== p.room ||
              Math.hypot(old.x - p.x, old.y - p.y) > 80
            )
              return { ...p };
            const blend = Math.min(1, dt / 65);
            return {
              ...p,
              x: old.x + (p.x - old.x) * blend,
              y: old.y + (p.y - old.y) * blend,
            };
          }) as GameState['players'];
          drawGame(
            this.g,
            { ...x.state, players: this.displayed },
            x.viewer,
            t,
            x.attract,
          );
        }
      }
      game = new Phaser.Game({
        type: Phaser.CANVAS,
        parent: host.current,
        width: W,
        height: H,
        pixelArt: true,
        antialias: false,
        roundPixels: true,
        backgroundColor: '#10100f',
        audio: { noAudio: true },
        banner: false,
        scene: RoomScene,
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
        fps: { target: 60 },
      });
    });
    return () => {
      disposed = true;
      game?.destroy(true);
    };
  }, []);
  return (
    <div
      className="game-canvas"
      ref={host}
      role="img"
      aria-label={`Hide and seek game. ${attract ? 'Living room preview' : state.players[viewer].room}. Use arrow keys or touch controls to move.`}
    />
  );
}
