interface Props {
  playing: boolean;
  onToggle: () => void;
  speed: number;
  onSpeedChange: (s: number) => void;
  angle?: number;
}

export default function AnimationControls({ playing, onToggle, speed, onSpeedChange, angle }: Props) {
  return (
    <div className="flex items-center gap-4 bg-gray-800/50 rounded-lg px-4 py-2 text-sm">
      <button
        onClick={onToggle}
        className="w-8 h-8 flex items-center justify-center rounded bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors"
      >
        {playing ? '⏸' : '▶'}
      </button>
      <div className="flex items-center gap-2">
        <span className="text-gray-400">Velocidad:</span>
        <input
          type="range"
          min={0.1}
          max={4}
          step={0.1}
          value={speed}
          onChange={e => onSpeedChange(parseFloat(e.target.value))}
          className="w-24 accent-orange-500"
        />
        <span className="text-gray-300 w-10 text-right">{speed.toFixed(1)}x</span>
      </div>
      {angle !== undefined && (
        <span className="text-gray-500 font-mono text-xs ml-auto">
          {Math.round(angle % 360)}°
        </span>
      )}
    </div>
  );
}
