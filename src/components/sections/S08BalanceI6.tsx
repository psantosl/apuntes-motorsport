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
  I6_OFFSETS,
} from '../../utils/engine';

/* ── Piston SVG geometry ── */
const NUM = 6;
const P_W = 40;
const P_H = 26;
const GAP = 10;
const CYL_H = 100;
const CYL_TOP = 30;
const BAR_MAX = 44;
const TOTAL_W = NUM * P_W + (NUM - 1) * GAP;
const MARGIN_X = 30;
const VB_W = TOTAL_W + MARGIN_X * 2 + 100; // extra for sum readout
const VB_H = CYL_TOP + CYL_H + 20 + BAR_MAX * 2 + 50;

/* ── Comparison graph geometry ── */
const GR_W = 580;
const GR_H = 180;
const GR_PAD_L = 55;
const GR_PAD_R = 20;
const GR_PAD_T = 24;
const GR_PAD_B = 34;
const GR_PLOT_W = GR_W - GR_PAD_L - GR_PAD_R;
const GR_PLOT_H = GR_H - GR_PAD_T - GR_PAD_B;

function buildLine(offsets: number[], numCyl: number): string {
  const maxVal = 4 * 0.28; // I4 max for normalization
  const pts: string[] = [];
  for (let deg = 0; deg <= 720; deg += 2) {
    let sum = 0;
    for (let i = 0; i < numCyl; i++) {
      sum += secondaryForce(deg, offsets[i]);
    }
    const x = GR_PAD_L + (deg / 720) * GR_PLOT_W;
    const y = GR_PAD_T + GR_PLOT_H / 2 - (sum / maxVal) * (GR_PLOT_H / 2);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(' ');
}

export default function S08BalanceI6() {
  const [speed, setSpeed] = useState(1);
  const { angle, playing, toggle } = useAnimationLoop(speed);

  const crankAngle = angle % 720;

  const pistons = I6_OFFSETS.map((offset, i) => {
    const pos = pistonPosition(crankAngle + offset);
    const pf = primaryForce(crankAngle, offset);
    const sf = secondaryForce(crankAngle, offset);
    return { pos, pf, sf, color: PISTON_COLORS[(i + 1) as 1 | 2 | 3 | 4 | 5 | 6] };
  });

  const sumPrimary = pistons.reduce((s, p) => s + p.pf, 0);
  const sumSecondary = pistons.reduce((s, p) => s + p.sf, 0);

  const i4Line = useMemo(() => buildLine(I4_OFFSETS, 4), []);
  const i6Line = useMemo(() => buildLine(I6_OFFSETS, 6), []);

  // Current I4 secondary sum for marker
  const i4SecNow = I4_OFFSETS.reduce((s, off) => s + secondaryForce(crankAngle, off), 0);
  const maxVal = 4 * 0.28;
  const markerX = GR_PAD_L + (crankAngle / 720) * GR_PLOT_W;
  const markerYI4 = GR_PAD_T + GR_PLOT_H / 2 - (i4SecNow / maxVal) * (GR_PLOT_H / 2);
  const markerYI6 = GR_PAD_T + GR_PLOT_H / 2 - (sumSecondary / maxVal) * (GR_PLOT_H / 2);

  /* pairs for labeling */
  const pairs = [
    { a: 1, b: 6, note: '0° vs 600° (=240°)' },
    { a: 2, b: 5, note: '120° vs 480° (=120°)' },
    { a: 3, b: 4, note: '240° vs 360° (=360°)' },
  ];

  return (
    <SectionWrapper id="s08-balance-i6" title="8 · Balance del motor I6">
      <p className="text-gray-400 max-w-3xl mb-6">
        El motor de 6 cilindros en linea con offsets{' '}
        <strong className="text-white">[0, 120, 240, 360, 480, 600]</strong>{' '}
        tiene un balance perfecto: tanto fuerzas primarias como secundarias suman cero en todo
        momento.
      </p>

      <div className="flex flex-col items-center gap-6">
        {/* ── Piston animation ── */}
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="w-full max-w-2xl"
          style={{ minHeight: 280 }}
        >
          {/* Labels */}
          {pistons.map((p, i) => {
            const cx = MARGIN_X + i * (P_W + GAP) + P_W / 2;
            return (
              <text
                key={`lbl-${i}`}
                x={cx}
                y={CYL_TOP - 10}
                textAnchor="middle"
                fill={p.color}
                fontSize={10}
                fontWeight={700}
              >
                P{i + 1}
              </text>
            );
          })}

          {/* Cylinders and pistons */}
          {pistons.map((p, i) => {
            const x = MARGIN_X + i * (P_W + GAP);
            const pistonY = CYL_TOP + p.pos * (CYL_H - P_H);
            return (
              <g key={`cyl-${i}`}>
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

          {/* Force bars */}
          {(() => {
            const barAreaTop = CYL_TOP + CYL_H + 20;
            const barMidY = barAreaTop + BAR_MAX;
            return (
              <>
                <line
                  x1={MARGIN_X - 8}
                  y1={barMidY}
                  x2={MARGIN_X + TOTAL_W + 8}
                  y2={barMidY}
                  stroke="#4B5563"
                  strokeWidth={1}
                  strokeDasharray="4 3"
                />

                {pistons.map((p, i) => {
                  const cx = MARGIN_X + i * (P_W + GAP) + P_W / 2;
                  const pfH = p.pf * BAR_MAX;
                  const sfH = p.sf * BAR_MAX / 0.28;
                  return (
                    <g key={`bar-${i}`}>
                      <rect
                        x={cx - P_W / 2 + 2}
                        y={pfH < 0 ? barMidY : barMidY - pfH}
                        width={P_W / 2 - 4}
                        height={Math.abs(pfH)}
                        fill={p.color}
                        opacity={0.7}
                        rx={1}
                      />
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
                  x={MARGIN_X + TOTAL_W / 2 - 50}
                  y={barAreaTop - 6}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#9CA3AF"
                >
                  Primaria
                </text>
                <text
                  x={MARGIN_X + TOTAL_W / 2 + 50}
                  y={barAreaTop - 6}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#F59E0B"
                >
                  Secundaria
                </text>

                {/* Sum readout */}
                <g transform={`translate(${MARGIN_X + TOTAL_W + 16}, ${barAreaTop})`}>
                  <text fill="#9CA3AF" fontSize={10} y={0}>
                    Suma 1.as:
                  </text>
                  <text fill="#34D399" fontSize={11} fontWeight={700} y={14}>
                    {sumPrimary.toFixed(2)} {'\u2713'}
                  </text>
                  <text fill="#F59E0B" fontSize={10} y={34}>
                    Suma 2.as:
                  </text>
                  <text fill="#34D399" fontSize={11} fontWeight={700} y={48}>
                    {sumSecondary.toFixed(2)} {'\u2713'}
                  </text>
                </g>
              </>
            );
          })()}
        </svg>

        {/* ── Pairs info ── */}
        <div className="flex flex-wrap gap-4 justify-center">
          {pairs.map(({ a, b, note }) => (
            <div
              key={`${a}-${b}`}
              className="bg-gray-800/50 rounded-lg px-4 py-2 text-center text-sm"
            >
              <span style={{ color: PISTON_COLORS[a as 1 | 2 | 3 | 4 | 5 | 6] }}>
                P{a}
              </span>
              <span className="text-gray-500 mx-2">&harr;</span>
              <span style={{ color: PISTON_COLORS[b as 1 | 2 | 3 | 4 | 5 | 6] }}>
                P{b}
              </span>
              <div className="text-gray-500 text-xs mt-1">{note}</div>
            </div>
          ))}
        </div>

        {/* ── Comparative graph: I4 vs I6 secondary force ── */}
        <div className="w-full max-w-xl">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">
            Comparativa: fuerza secundaria neta — I4 vs I6
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
                  y={GR_H - 6}
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
              x={14}
              y={GR_PAD_T + GR_PLOT_H / 2}
              textAnchor="middle"
              fill="#6B7280"
              fontSize={9}
              transform={`rotate(-90, 14, ${GR_PAD_T + GR_PLOT_H / 2})`}
            >
              F neta 2.as
            </text>

            {/* I4 line */}
            <polyline
              points={i4Line}
              fill="none"
              stroke="#F59E0B"
              strokeWidth={2}
              opacity={0.8}
            />
            {/* I6 line */}
            <polyline
              points={i6Line}
              fill="none"
              stroke="#34D399"
              strokeWidth={2}
              opacity={0.8}
            />

            {/* Legend */}
            <rect x={GR_PAD_L + 10} y={GR_PAD_T + 2} width={10} height={3} fill="#F59E0B" rx={1} />
            <text x={GR_PAD_L + 24} y={GR_PAD_T + 6} fill="#F59E0B" fontSize={9}>I4</text>
            <rect x={GR_PAD_L + 50} y={GR_PAD_T + 2} width={10} height={3} fill="#34D399" rx={1} />
            <text x={GR_PAD_L + 64} y={GR_PAD_T + 6} fill="#34D399" fontSize={9}>I6</text>

            {/* Markers */}
            <circle cx={markerX} cy={markerYI4} r={3.5} fill="#F59E0B" />
            <circle cx={markerX} cy={markerYI6} r={3.5} fill="#34D399" />
            <line
              x1={markerX}
              y1={GR_PAD_T}
              x2={markerX}
              y2={GR_PAD_T + GR_PLOT_H}
              stroke="#9CA3AF"
              strokeWidth={0.8}
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
        <h3 className="text-lg font-semibold text-white">Por que el I6 es perfecto?</h3>
        <p className="text-gray-400">
          Ningun piston comparte exactamente la misma fase con otro. Los 6 cilindros estan
          separados 120° en pares opuestos: <strong className="text-white">1-6</strong>,{' '}
          <strong className="text-white">2-5</strong> y{' '}
          <strong className="text-white">3-4</strong>. En cada par, cuando uno genera una fuerza
          hacia arriba, el otro genera una hacia abajo — tanto en la componente primaria (1x)
          como en la secundaria (2x).
        </p>
        <p className="text-gray-400">
          La geometria hace que las 6 fuerzas primarias sumen exactamente cero, y las 6
          secundarias tambien. El resultado: <strong className="text-emerald-400">no necesita eje
          de equilibrado</strong>. Por eso el I6 se considera el motor con mejor balance natural,
          y es la razon de su suavidad legendaria (BMW S54, S58, etc.).
        </p>
      </div>
    </SectionWrapper>
  );
}
