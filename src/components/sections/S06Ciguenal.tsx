import { useState } from 'react';
import { I4_OFFSETS, I6_OFFSETS, PISTON_COLORS } from '../../utils/engine';
import { useAnimationLoop } from '../../hooks/useAnimationLoop';
import SectionWrapper from '../SectionWrapper';
import AnimationControls from '../AnimationControls';

/* ── Types ────────────────────────────────────────────── */

type ConfigKey = 'I4' | 'I6';

const CONFIGS: Record<ConfigKey, { label: string; offsets: number[] }> = {
  I4: { label: 'I4 (0°-180°-180°-0°)', offsets: I4_OFFSETS },
  I6: { label: 'I6 (0°-120°-240°-360°-480°-600°)', offsets: I6_OFFSETS },
};

/* ── Side view constants ──────────────────────────────── */

const SIDE_W = 620;
const SIDE_H = 200;
const JOURNAL_R = 10;
const ARM_H = 30;
const PIN_R = 8;
const SPACING = 90;

/* ── Side view component ──────────────────────────────── */

function CrankSideView({ offsets, angle }: { offsets: number[]; angle: number }) {
  const n = offsets.length;
  const totalW = (n - 1) * SPACING;
  const startX = (SIDE_W - totalW) / 2;
  const axisY = SIDE_H / 2;

  return (
    <svg width={SIDE_W} height={SIDE_H} viewBox={`0 0 ${SIDE_W} ${SIDE_H}`} className="bg-gray-900/50 rounded-lg border border-gray-700/50">
      {/* Main axis line */}
      <line
        x1={startX - 40} y1={axisY}
        x2={startX + totalW + 40} y2={axisY}
        stroke="#6B7280" strokeWidth={6} strokeLinecap="round"
      />

      {/* Main journals */}
      {Array.from({ length: n + 1 }).map((_, i) => {
        const x = startX + (i - 0.5) * SPACING;
        if (x < startX - 40 || x > startX + totalW + 40) return null;
        return (
          <g key={`journal-${i}`}>
            <circle cx={x} cy={axisY} r={JOURNAL_R} fill="#4B5563" stroke="#9CA3AF" strokeWidth={1.5} />
          </g>
        );
      })}

      {/* Crankpins with arms */}
      {offsets.map((offset, i) => {
        const x = startX + i * SPACING;
        const pinAngleRad = ((angle + offset) * Math.PI) / 180;
        // Project pin position in side view: only vertical displacement visible
        const pinY = axisY - Math.sin(pinAngleRad) * ARM_H;
        const color = PISTON_COLORS[(i + 1) as keyof typeof PISTON_COLORS] ?? '#9CA3AF';

        return (
          <g key={`pin-${i}`}>
            {/* Crank arm */}
            <line
              x1={x} y1={axisY} x2={x} y2={pinY}
              stroke="#9CA3AF" strokeWidth={10} strokeLinecap="round" opacity={0.6}
            />
            {/* Crankpin */}
            <circle cx={x} cy={pinY} r={PIN_R} fill={color} stroke="#fff" strokeWidth={1.5} />
            {/* Cylinder label */}
            <text x={x} y={SIDE_H - 8} textAnchor="middle" fontSize={11} fill="#9CA3AF" fontWeight={600}>
              Cil. {i + 1}
            </text>
          </g>
        );
      })}

      {/* Labels for first pin */}
      <g opacity={0.8}>
        {/* Axis label */}
        <text x={startX - 50} y={axisY - 14} fontSize={9} fill="#6B7280" textAnchor="middle">Muñón</text>
        <text x={startX - 50} y={axisY - 4} fontSize={9} fill="#6B7280" textAnchor="middle">principal</text>
        <line x1={startX - 38} y1={axisY} x2={startX - 28} y2={axisY} stroke="#6B7280" strokeWidth={0.8} markerEnd="url(#arrowGray)" />

        {/* Arm label */}
        <text x={startX + totalW + 55} y={axisY - 20} fontSize={9} fill="#6B7280" textAnchor="middle">Brazo de</text>
        <text x={startX + totalW + 55} y={axisY - 10} fontSize={9} fill="#6B7280" textAnchor="middle">manivela</text>

        {/* Pin label */}
        <text x={startX + totalW + 55} y={axisY + 14} fontSize={9} fill="#6B7280" textAnchor="middle">Muñequilla</text>
      </g>

      <defs>
        <marker id="arrowGray" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
          <polygon points="0 0, 6 2, 0 4" fill="#6B7280" />
        </marker>
      </defs>
    </svg>
  );
}

/* ── Front view constants ─────────────────────────────── */

const FRONT_W = 360;
const FRONT_H = 380;
const CRANK_CY = 250;           // crankshaft center Y
const CRANK_CX = FRONT_W / 2;
const ORBIT_R = 50;
const FRONT_PIN_R = 7;
const BIELA_LEN = 140;          // connecting rod length (fixed, must be > ORBIT_R + max piston spread)
const PISTON_W = 22;
const PISTON_H = 14;
const PISTON_GAP = 4;           // gap between pistons

/* ── Front view component ─────────────────────────────── */

function CrankFrontView({ offsets, angle }: { offsets: number[]; angle: number }) {
  return (
    <svg viewBox={`0 0 ${FRONT_W} ${FRONT_H}`} className="w-full max-w-xs bg-gray-900/50 rounded-lg border border-gray-700/50">
      {/* Cylinder walls (vertical guide lines for pistons) */}
      {(() => {
        // TDC: crank at 0° → pinY = CRANK_CY - ORBIT_R, dx = 0
        const tdcBulonY = CRANK_CY - ORBIT_R - BIELA_LEN;
        // BDC: crank at 180° → pinY = CRANK_CY + ORBIT_R, dx = 0
        const bdcBulonY = CRANK_CY + ORBIT_R - BIELA_LEN;
        const tdcY = tdcBulonY;
        const bdcY = bdcBulonY;
        return offsets.map((_, i) => {
          const n = offsets.length;
          const totalW = n * (PISTON_W + PISTON_GAP) - PISTON_GAP;
          const pistonCX = CRANK_CX - totalW / 2 + i * (PISTON_W + PISTON_GAP) + PISTON_W / 2;
          return (
            <g key={`wall-${i}`}>
              <line x1={pistonCX - PISTON_W / 2 - 2} y1={tdcY - PISTON_H}
                x2={pistonCX - PISTON_W / 2 - 2} y2={bdcY + PISTON_H}
                stroke="#2A2A35" strokeWidth={1} />
              <line x1={pistonCX + PISTON_W / 2 + 2} y1={tdcY - PISTON_H}
                x2={pistonCX + PISTON_W / 2 + 2} y2={bdcY + PISTON_H}
                stroke="#2A2A35" strokeWidth={1} />
            </g>
          );
        });
      })()}

      {/* Orbit circle (dashed) */}
      <circle cx={CRANK_CX} cy={CRANK_CY} r={ORBIT_R} fill="none" stroke="#374151" strokeWidth={1} strokeDasharray="4 4" />

      {/* Center dot (main journal) */}
      <circle cx={CRANK_CX} cy={CRANK_CY} r={6} fill="#4B5563" stroke="#6B7280" strokeWidth={1.5} />

      {/* Crankpins, bielas, and pistons */}
      {offsets.map((offset, i) => {
        const rad = ((angle + offset) * Math.PI) / 180;
        // Crankpin position (0° = top, clockwise)
        const pinX = CRANK_CX + ORBIT_R * Math.sin(rad);
        const pinY = CRANK_CY - ORBIT_R * Math.cos(rad);
        const color = PISTON_COLORS[(i + 1) as keyof typeof PISTON_COLORS] ?? '#9CA3AF';

        // Piston X: spread horizontally for visualization
        const n = offsets.length;
        const totalW = n * (PISTON_W + PISTON_GAP) - PISTON_GAP;
        const pistonCX = CRANK_CX - totalW / 2 + i * (PISTON_W + PISTON_GAP) + PISTON_W / 2;

        // Piston Y: computed on the REAL centerline (X = CRANK_CX),
        // like in a real inline engine where all pistons share one axis.
        // This ensures paired pistons (same offset) are always at the same height.
        const dxCenter = CRANK_CX - pinX;  // = -ORBIT_R * sin(rad)
        const bielaVert = Math.sqrt(BIELA_LEN * BIELA_LEN - dxCenter * dxCenter);
        const pistonY = pinY - bielaVert;

        return (
          <g key={`fpin-${i}`}>
            {/* Crank arm (center to pin) */}
            <line x1={CRANK_CX} y1={CRANK_CY} x2={pinX} y2={pinY}
              stroke={color} strokeWidth={3} opacity={0.4} />

            {/* Biela (connecting rod: pin to piston) */}
            <line x1={pinX} y1={pinY} x2={pistonCX} y2={pistonY}
              stroke="#9CA3AF" strokeWidth={2.5} strokeLinecap="round" />

            {/* Wrist pin (bulón) */}
            <circle cx={pistonCX} cy={pistonY} r={3} fill="#D1D5DB" />

            {/* Piston */}
            <rect
              x={pistonCX - PISTON_W / 2} y={pistonY - PISTON_H / 2}
              width={PISTON_W} height={PISTON_H}
              rx={3}
              fill={color} opacity={0.85}
              stroke="#fff" strokeWidth={1} strokeOpacity={0.3}
            />
            {/* Piston label */}
            <text x={pistonCX} y={pistonY + 1} textAnchor="middle" dominantBaseline="middle"
              fontSize={9} fontWeight={700} fill="#fff">
              {i + 1}
            </text>

            {/* Crankpin dot */}
            <circle cx={pinX} cy={pinY} r={FRONT_PIN_R} fill={color}
              stroke="#fff" strokeWidth={1} opacity={0.9} />
          </g>
        );
      })}

      {/* Degree labels */}
      <text x={CRANK_CX} y={CRANK_CY - ORBIT_R - 16} textAnchor="middle" fontSize={9} fill="#6B7280">0°</text>
      <text x={CRANK_CX + ORBIT_R + 14} y={CRANK_CY + 4} textAnchor="middle" fontSize={9} fill="#6B7280">90°</text>
      <text x={CRANK_CX} y={CRANK_CY + ORBIT_R + 16} textAnchor="middle" fontSize={9} fill="#6B7280">180°</text>
      <text x={CRANK_CX - ORBIT_R - 14} y={CRANK_CY + 4} textAnchor="middle" fontSize={9} fill="#6B7280">270°</text>
    </svg>
  );
}

/* ── Main component ───────────────────────────────────── */

export default function S06Ciguenal() {
  const [speed, setSpeed] = useState(1);
  const [config, setConfig] = useState<ConfigKey>('I4');
  const { angle, playing, toggle } = useAnimationLoop(speed);

  const { offsets } = CONFIGS[config];

  return (
    <SectionWrapper id="ciguenal" title="El cigüeñal y las muñequillas">
      <p className="text-gray-300 max-w-3xl mb-6">
        El cigüeñal convierte el movimiento lineal de los pistones en rotación.
        Sus <strong className="text-white">muñequillas</strong> (crankpins) son los puntos excéntricos donde
        se conectan las bielas. La posición angular de cada muñequilla determina en qué
        fase del ciclo se encuentra su pistón.
      </p>

      <AnimationControls
        playing={playing}
        onToggle={toggle}
        speed={speed}
        onSpeedChange={setSpeed}
        angle={angle}
      />

      {/* Config selector */}
      <div className="flex gap-3 mt-4 mb-6">
        {(Object.keys(CONFIGS) as ConfigKey[]).map((key) => (
          <button
            key={key}
            onClick={() => setConfig(key)}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              config === key
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
            }`}
          >
            {CONFIGS[key].label}
          </button>
        ))}
      </div>

      {/* Diagrams */}
      <div className="space-y-8">
        {/* Side view */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Vista lateral</h3>
          <p className="text-gray-400 text-sm mb-3">
            Eje horizontal = muñones principales. Los brazos conectan cada muñequilla al eje.
          </p>
          <div className="overflow-x-auto">
            <CrankSideView offsets={offsets} angle={angle} />
          </div>
        </div>

        {/* Front view */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Vista frontal</h3>
          <p className="text-gray-400 text-sm mb-3">
            Mirando el cigüeñal de frente, como un reloj. Cada muñequilla gira en su posición angular.
          </p>
          <CrankFrontView offsets={offsets} angle={angle} />

          {/* Pin angle legend */}
          <div className="flex flex-wrap gap-3 mt-4">
            {offsets.map((offset, i) => {
              const color = PISTON_COLORS[(i + 1) as keyof typeof PISTON_COLORS] ?? '#9CA3AF';
              return (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-gray-400">
                    Cil. {i + 1}: <span className="text-gray-200 font-mono">{offset}°</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Key concept box */}
      <div className="mt-8 max-w-3xl p-5 bg-orange-500/10 rounded-lg border border-orange-500/30">
        <h4 className="text-orange-400 font-semibold mb-2">Concepto clave</h4>
        <p className="text-gray-300 text-sm leading-relaxed">
          La muñequilla es el punto excéntrico desplazado del centro de giro. Su posición angular
          determina en qué fase del ciclo está ese pistón. Dos muñequillas en el mismo ángulo =
          dos pistones que van siempre sincronizados.
        </p>
        <p className="text-gray-400 text-sm mt-3 leading-relaxed">
          En el I4, los cilindros 1 y 4 comparten ángulo (0°) y los cilindros 2 y 3 están a 180°.
          Por eso, cuando 1 y 4 están en el PMS, 2 y 3 están en el PMI.
          En el I6, las muñequillas se reparten cada 120°, consiguiendo un equilibrio perfecto
          tanto de fuerzas primarias como secundarias.
        </p>
      </div>
    </SectionWrapper>
  );
}
