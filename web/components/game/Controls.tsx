'use client';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
export default function Controls({
  onMove,
  onAction,
  label,
  disabled,
}: {
  onMove: (x: number, y: number) => void;
  onAction: (down: boolean) => void;
  label: string;
  disabled: boolean;
}) {
  return (
    <div className={`touch-controls ${disabled ? 'controls-inactive' : ''}`}>
      <div className="dpad" aria-label="Movement controls">
        {[
          { name: 'up', x: 0, y: -1, Icon: ArrowUp },
          { name: 'left', x: -1, y: 0, Icon: ArrowLeft },
          { name: 'right', x: 1, y: 0, Icon: ArrowRight },
          { name: 'down', x: 0, y: 1, Icon: ArrowDown },
        ].map(({ name, x, y, Icon }) => (
          <button
            key={name}
            className={`pad-${name}`}
            aria-label={`Move ${name}`}
            disabled={disabled}
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              onMove(x, y);
            }}
            onPointerUp={() => onMove(0, 0)}
            onPointerCancel={() => onMove(0, 0)}
            onLostPointerCapture={() => onMove(0, 0)}
            onContextMenu={(e) => e.preventDefault()}
          >
            <Icon size={21} />
          </button>
        ))}
        <span className="pad-center" />
      </div>
      <div className="control-caption">
        <p>MOVE</p>
        <span>Arrows / WASD</span>
      </div>
      <div className="action-group">
        <button
          className="action-button"
          disabled={disabled}
          onPointerDown={(e) => {
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            onAction(true);
          }}
          onPointerUp={() => onAction(false)}
          onPointerCancel={() => onAction(false)}
          onLostPointerCapture={() => onAction(false)}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') onAction(true);
          }}
          onKeyUp={() => onAction(false)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {label}
        </button>
        <span>HOLD · SPACE / E</span>
      </div>
    </div>
  );
}
