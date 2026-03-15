import { useState, useMemo } from 'react';
import SectionWrapper from '../SectionWrapper';
import AnimationControls from '../AnimationControls';
import { useAnimationLoop } from '../../hooks/useAnimationLoop';
import {
  pistonPosition,
  primaryForce,
  secondaryForce,
  PISTON_COLORS,
  I4_OFFSETS,
} from '../../utils/engine';

/* ── SVG geometry ── */
const NUM = 4;
const P_W = 48;          // piston width
const P_H = 30;          // piston height
const GAP = 16;           // gap between cylinders
const CYL_H = 120;       // cylinder height (stroke area)
const CYL_TOP = 30;
const BAR_MAX = 50;       // max force bar height
const TOTAL_W = NUM * P_W + (NUM - 1) * GAP;
const MARGIN_X = 40;
const VB_W = TOTAL_W + MARGIN_X * 2;
const VB_H = CYL_TOP + CYL_H + 20 + BAR_MAX * 2 + 60; // pistons + force bars + labels

/* ── Graph geometry ── */
const GR_W = 560;
const GR_H = 160;
const GR_PAD_L = 50;
const GR_PAD_R = 20;
const GR_PAD_T = 20;
const GR_PAD_B = 30;
const GR_PLOT_W = GR_W - GR_PAD_L - GR_PAD_R;
const GR_PLOT_H = GR_H - GR_PAD_T - GR_PAD_B;

function buildSecondaryGraph(): string {
  const points: string[] = [];
  for (let deg = 0; deg <= 720; deg += 2) {
    let sum = 0;
    for (let i = 0; i < NUM; i++) {
      sum += secondaryForce(deg, I4_OFFSETS[i]);
    }
    const x = GR_PAD_L + (deg / 720) * GR_PLOT_W;
    // sum ranges roughly -NUM*lambda to +NUM*lambda → ±1.12
    const maxVal = NUM * 0.28;
    const y = GR_PAD_T + GR_PLOT_H / 2 - (sum / maxVal) * (GR_PLOT_H / 2);
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return points.join(' ');
}

export default function S07BalanceI4() {
  const [speed, setSpeed] = useState(1);
  const { angle, playing, toggle } = useAnimationLoop(speed);

  const crankAngle = angle % 720;

  // Per-piston data
  const pistons = I4_OFFSETS.map((offset, i) => {
    const pos = pistonPosition(crankAngle + offset);
    const pf = primaryForce(crankAngle, offset);
    const sf = secondaryForce(crankAngle, offset);
    return { pos, pf, sf, color: PISTON_COLORS[(i + 1) as 1 | 2 | 3 | 4] };
  });

  const sumPrimary = pistons.reduce((s, p) => s + p.pf, 0);
  const sumSecondary = pistons.reduce((s, p) => s + p.sf, 0);

  const graphLine = useMemo(buildSecondaryGraph, []);

  // Current marker on graph
  const markerX = GR_PAD_L + (crankAngle / 720) * GR_PLOT_W;
  const maxVal = NUM * 0.28;
  const markerY = GR_PAD_T + GR_PLOT_H / 2 - (sumSecondary / maxVal) * (GR_PLOT_H / 2);

  return (
    <SectionWrapper id="s07-balance-i4" title="7 · Balance del motor I4">
      <p className="text-gray-400 max-w-3xl mb-6">
        El motor de 4 cilindros en linea tiene los pistones con offsets de ciguenal{' '}
        <strong className="text-white">[0, 180, 180, 0]</strong>. Los pistones 1-4 van juntos y
        los 2-3 van juntos: cuando uno sube, el otro baja. Las{' '}
        <strong className="text-white">fuerzas primarias</strong> se cancelan perfectamente, pero
        las <strong className="text-white">fuerzas secundarias</strong> (frecuencia 2x) no.
      </p>

      <div className="flex flex-col items-center gap-6">
        {/* ── Piston animation with force bars ── */}
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="w-full max-w-xl"
          style={{ minHeight: 320 }}
        >
          {/* Piston labels */}
          {pistons.map((p, i) => {
            const cx = MARGIN_X + i * (P_W + GAP) + P_W / 2;
            return (
              <text
                key={`lbl-${i}`}
                x={cx}
                y={CYL_TOP - 10}
                textAnchor="middle"
                fill={p.color}
                fontSize={11}
                fontWeight={700}
              >
                P{i + 1}
              </text>
            );
          })}

          {/* Cylinder walls and pistons */}
          {pistons.map((p, i) => {
            const x = MARGIN_X + i * (P_W + GAP);
            const pistonY = CYL_TOP + p.pos * (CYL_H - P_H);
            return (
              <g key={`cyl-${i}`}>
                {/* Cylinder walls */}
                <rect
                  x={x - 2}
                  y={CYL_TOP}
                  width={P_W + 4}
                  height={CYL_H}
                  rx={2}
                  fill="none"
                  stroke="#4B5563"
                  strokeWidth={1.5}
                />
                {/* Piston */}
                <rect
                  x={x}
                  y={pistonY}
                  width={P_W}
                  height={P_H}
                  rx={3}
                  fill={p.color}
                  opacity={0.9}
                />
              </g>
            );
          })}

          {/* Force bars section */}
          {(() => {
            const barAreaTop = CYL_TOP + CYL_H + 20;
            const barMidY = barAreaTop + BAR_MAX;
            return (
              <>
                {/* Zero line */}
                <line
                  x1={MARGIN_X - 10}
                  y1={barMidY}
                  x2={MARGIN_X + TOTAL_W + 10}
                  y2={barMidY}
                  stroke="#4B5563"
                  strokeWidth={1}
                  strokeDasharray="4 3"
                />
                <text
                  x={MARGIN_X - 14}
                  y={barMidY + 4}
                  textAnchor="end"
                  fill="#6B7280"
                  fontSize={9}
                >
                  0
                </text>

                {/* Per-piston force bars */}
                {pistons.map((p, i) => {
                  const cx = MARGIN_X + i * (P_W + GAP) + P_W / 2;
                  const pfH = p.pf * BAR_MAX;
                  const sfH = p.sf * BAR_MAX / 0.28; // normalize to same visual scale
                  return (
                    <g key={`bar-${i}`}>
                      {/* Primary force bar (left half) */}
                      <rect
                        x={cx - P_W / 2 + 2}
                        y={pfH < 0 ? barMidY : barMidY - pfH}
                        width={P_W / 2 - 4}
                        height={Math.abs(pfH)}
                        fill={p.color}
                        opacity={0.7}
                        rx={1}
                      />
                      {/* Secondary force bar (right half) */}
                      <rect
                        x={cx + 2}
                        y={sfH < 0 ? barMidY : barMidY - sfH}
                        width={P_W / 2 - 4}
                        height={Math.abs(sfH)}
                        fill="#F59E0B"
                        opacity={0.7}
                        rx={1}
                      />
                    </g>
                  );
                })}

                {/* Labels */}
                <text
                  x={MARGIN_X + TOTAL_W / 2 - 40}
                  y={barAreaTop - 6}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#9CA3AF"
                >
                  Primaria
                </text>
                <text
                  x={MARGIN_X + TOTAL_W / 2 + 40}
                  y={barAreaTop - 6}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#F59E0B"
                >
                  Secundaria
                </text>

                {/* Sum readout */}
                <g transform={`translate(${MARGIN_X + TOTAL_W + 20}, ${barAreaTop})`}>
                  <text fill="#9CA3AF" fontSize={10} y={0}>
                    Suma 1.as:
                  </text>
                  <text
                    fill={Math.abs(sumPrimary) < 0.05 ? '#34D399' : '#F87171'}
                    fontSize={11}
                    fontWeight={700}
                    y={14}
                  >
                    {sumPrimary.toFixed(2)}{' '}
                    {Math.abs(sumPrimary) < 0.05 ? '\u2713' : '\u2717'}
                  </text>
                  <text fill="#F59E0B" fontSize={10} y={34}>
                    Suma 2.as:
                  </text>
                  <text
                    fill={Math.abs(sumSecondary) < 0.05 ? '#34D399' : '#F87171'}
                    fontSize={11}
                    fontWeight={700}
                    y={48}
                  >
                    {sumSecondary.toFixed(2)}{' '}
                    {Math.abs(sumSecondary) < 0.05 ? '\u2713' : '\u2717'}
                  </text>
                </g>
              </>
            );
          })()}
        </svg>

        {/* ── Net secondary force graph ── */}
        <div className="w-full max-w-xl">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">
            Fuerza secundaria neta vs angulo de ciguenal
          </h3>
          <svg viewBox={`0 0 ${GR_W} ${GR_H}`} className="w-full bg-gray-800/40 rounded-lg">
            {/* Axes */}
            <line
              x1={GR_PAD_L}
              y1={GR_PAD_T + GR_PLOT_H / 2}
              x2={GR_PAD_L + GR_PLOT_W}
              y2={GR_PAD_T + GR_PLOT_H / 2}
              stroke="#4B5563"
              strokeWidth={1}
            />
            <line
              x1={GR_PAD_L}
              y1={GR_PAD_T}
              x2={GR_PAD_L}
              y2={GR_PAD_T + GR_PLOT_H}
              stroke="#4B5563"
              strokeWidth={1}
            />
            {/* X-axis labels */}
            {[0, 180, 360, 540, 720].map((deg) => {
              const x = GR_PAD_L + (deg / 720) * GR_PLOT_W;
              return (
                <text
                  key={deg}
                  x={x}
                  y={GR_H - 4}
                  textAnchor="middle"
                  fill="#6B7280"
                  fontSize={9}
                >
                  {deg}°
                </text>
              );
            })}
            {/* Y-axis label */}
            <text
              x={12}
              y={GR_PAD_T + GR_PLOT_H / 2}
              textAnchor="middle"
              fill="#6B7280"
              fontSize={9}
              transform={`rotate(-90, 12, ${GR_PAD_T + GR_PLOT_H / 2})`}
            >
              F neta 2.as
            </text>

            {/* Graph line */}
            <polyline
              points={graphLine}
              fill="none"
              stroke="#F59E0B"
              strokeWidth={2}
              opacity={0.8}
            />

            {/* Current position marker */}
            <circle cx={markerX} cy={markerY} r={4} fill="#F59E0B" />
            <line
              x1={markerX}
              y1={GR_PAD_T}
              x2={markerX}
              y2={GR_PAD_T + GR_PLOT_H}
              stroke="#F59E0B"
              strokeWidth={1}
              opacity={0.3}
            />
          </svg>
        </div>

        <AnimationControls
          playing={playing}
          onToggle={toggle}
          speed={speed}
          onSpeedChange={setSpeed}
          angle={crankAngle}
        />
      </div>

      {/* ── Explanation ── */}
      <div className="mt-8 max-w-3xl space-y-3">
        <h3 className="text-lg font-semibold text-white">Por que no se cancelan las secundarias?</h3>
        <p className="text-gray-400">
          Los pistones 1 y 4 van exactamente juntos (offset 0), y los pistones 2 y 3 tambien
          (offset 180). Cuando 1-4 estan arriba, 2-3 estan abajo, y las fuerzas primarias (frecuencia 1x)
          se cancelan perfectamente: dos hacia arriba, dos hacia abajo.
        </p>
        <p className="text-gray-400">
          Pero las fuerzas secundarias (frecuencia 2x) van <strong className="text-white">todas
          en la misma direccion al mismo tiempo</strong>. cos(2·0°) = cos(2·180°) = cos(0°) = 1.
          Los cuatro pistones suman en vez de cancelarse. El resultado es una vibracion a{' '}
          <strong className="text-orange-400">doble frecuencia</strong> del ciguenal.
        </p>
        <p className="text-gray-400">
          Solucion: un <strong className="text-white">eje de equilibrado (balance shaft)</strong>{' '}
          girando al doble de velocidad del ciguenal genera una fuerza opuesta que cancela esta
          vibracion.
        </p>
      </div>
    </SectionWrapper>
  );
}
