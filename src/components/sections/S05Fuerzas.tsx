import { useState, useMemo } from 'react';
import { primaryForce, secondaryForce } from '../../utils/engine';
import { useAnimationLoop } from '../../hooks/useAnimationLoop';
import SectionWrapper from '../SectionWrapper';
import AnimationControls from '../AnimationControls';

/* ── Chart constants ──────────────────────────────────── */

const CHART_W = 680;
const CHART_H = 260;
const PAD_L = 48;
const PAD_R = 16;
const PAD_T = 20;
const PAD_B = 36;
const PLOT_W = CHART_W - PAD_L - PAD_R;
const PLOT_H = CHART_H - PAD_T - PAD_B;

const SAMPLES = 360; // one sample per 2 degrees over 720°

const PRIMARY_COLOR = '#378ADD';
const SECONDARY_COLOR = '#D85A30';
const COMBINED_COLOR = '#1D9E75';

/* ── Wave path builder ────────────────────────────────── */

function buildPath(
  fn: (deg: number) => number,
  yMin: number,
  yMax: number,
): string {
  const pts: string[] = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const deg = (i / SAMPLES) * 720;
    const val = fn(deg);
    const x = PAD_L + (i / SAMPLES) * PLOT_W;
    const y = PAD_T + ((yMax - val) / (yMax - yMin)) * PLOT_H;
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(' ');
}

/* ── Axis tick labels ─────────────────────────────────── */

const X_TICKS = [0, 90, 180, 270, 360, 450, 540, 630, 720];

/* ── Main component ───────────────────────────────────── */

export default function S05Fuerzas() {
  const [speed, setSpeed] = useState(1);
  const [lambda, setLambda] = useState(0.28);
  const [showCombined, setShowCombined] = useState(true);
  const { angle, playing, toggle } = useAnimationLoop(speed);

  // Y range depends on lambda: primary goes -1..1, secondary -lambda..lambda
  // combined max is 1+lambda
  const yMax = 1 + lambda + 0.05;
  const yMin = -1 - lambda - 0.05;

  const primaryPath = useMemo(
    () => buildPath((deg) => primaryForce(deg, 0), yMin, yMax),
    [yMin, yMax],
  );
  const secondaryPath = useMemo(
    () => buildPath((deg) => secondaryForce(deg, 0, lambda), yMin, yMax),
    [lambda, yMin, yMax],
  );
  const combinedPath = useMemo(
    () =>
      buildPath(
        (deg) => primaryForce(deg, 0) + secondaryForce(deg, 0, lambda),
        yMin,
        yMax,
      ),
    [lambda, yMin, yMax],
  );

  // Current angle cursor (within 720°)
  const angle720 = angle % 720;
  const cursorX = PAD_L + (angle720 / 720) * PLOT_W;

  // Current values
  const curPrimary = primaryForce(angle720, 0);
  const curSecondary = secondaryForce(angle720, 0, lambda);
  const curCombined = curPrimary + curSecondary;

  // Zero line Y
  const zeroY = PAD_T + (yMax / (yMax - yMin)) * PLOT_H;

  return (
    <SectionWrapper id="fuerzas" title="Fuerzas primarias y secundarias">
      <p className="text-gray-300 max-w-3xl mb-4">
        El pistón <strong className="text-white">no se mueve de forma sinusoidal pura</strong>.
        La geometría de la biela hace que el pistón pase menos tiempo cerca del PMS
        y más cerca del PMI. Esto crea dos componentes de fuerza inercial:
      </p>
      <ul className="text-gray-300 max-w-3xl mb-6 list-disc list-inside space-y-1 text-sm">
        <li>
          <strong style={{ color: PRIMARY_COLOR }}>Fuerza primaria</strong>: varía
          a 1x la frecuencia del motor &mdash; la componente principal de la aceleración del pistón.
        </li>
        <li>
          <strong style={{ color: SECONDARY_COLOR }}>Fuerza secundaria</strong>: varía
          a 2x la frecuencia &mdash; causada por la inclinación de la biela. Su amplitud
          depende de <em>&lambda; = r/l</em>.
        </li>
        <li>
          <strong style={{ color: COMBINED_COLOR }}>Fuerza combinada</strong>: la suma
          de ambas &mdash; nótese la asimetría entre PMS y PMI.
        </li>
      </ul>

      <AnimationControls
        playing={playing}
        onToggle={toggle}
        speed={speed}
        onSpeedChange={setSpeed}
        angle={angle}
      />

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-6 mt-4 mb-4">
        {/* Lambda slider */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">&lambda; (r/l):</span>
          <input
            type="range"
            min={0.20}
            max={0.40}
            step={0.01}
            value={lambda}
            onChange={(e) => setLambda(parseFloat(e.target.value))}
            className="w-32 accent-orange-500"
          />
          <span className="text-gray-300 font-mono w-12 text-right">{lambda.toFixed(2)}</span>
        </div>

        {/* Toggle combined */}
        <label className="flex items-center gap-2 text-sm cursor-pointer text-gray-400 select-none">
          <input
            type="checkbox"
            checked={showCombined}
            onChange={(e) => setShowCombined(e.target.checked)}
            className="accent-green-500 w-4 h-4"
          />
          Mostrar fuerza combinada
        </label>
      </div>

      {/* Chart */}
      <div className="overflow-x-auto">
        <svg
          width={CHART_W}
          height={CHART_H}
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          className="bg-gray-900/50 rounded-lg border border-gray-700/50"
        >
          {/* Grid lines */}
          {X_TICKS.map((deg) => {
            const x = PAD_L + (deg / 720) * PLOT_W;
            return (
              <g key={deg}>
                <line x1={x} y1={PAD_T} x2={x} y2={PAD_T + PLOT_H} stroke="#374151" strokeWidth={0.5} />
                <text x={x} y={CHART_H - 6} textAnchor="middle" fontSize={10} fill="#6B7280">
                  {deg}°
                </text>
              </g>
            );
          })}

          {/* Y-axis labels */}
          {[-1, -0.5, 0, 0.5, 1].map((v) => {
            const y = PAD_T + ((yMax - v) / (yMax - yMin)) * PLOT_H;
            return (
              <g key={v}>
                <line x1={PAD_L} y1={y} x2={PAD_L + PLOT_W} y2={y} stroke={v === 0 ? '#6B7280' : '#1F2937'} strokeWidth={v === 0 ? 1 : 0.5} />
                <text x={PAD_L - 6} y={y + 3} textAnchor="end" fontSize={10} fill="#6B7280">
                  {v}
                </text>
              </g>
            );
          })}

          {/* Waves */}
          <path d={primaryPath} fill="none" stroke={PRIMARY_COLOR} strokeWidth={2} opacity={0.9} />
          <path d={secondaryPath} fill="none" stroke={SECONDARY_COLOR} strokeWidth={2} opacity={0.9} />
          {showCombined && (
            <path d={combinedPath} fill="none" stroke={COMBINED_COLOR} strokeWidth={2.5} opacity={0.85} strokeDasharray="6 3" />
          )}

          {/* Animated cursor line */}
          <line
            x1={cursorX} y1={PAD_T}
            x2={cursorX} y2={PAD_T + PLOT_H}
            stroke="#EF9F27" strokeWidth={1.5} opacity={0.8}
          />

          {/* Value dots on cursor */}
          <circle cx={cursorX} cy={PAD_T + ((yMax - curPrimary) / (yMax - yMin)) * PLOT_H} r={4} fill={PRIMARY_COLOR} />
          <circle cx={cursorX} cy={PAD_T + ((yMax - curSecondary) / (yMax - yMin)) * PLOT_H} r={4} fill={SECONDARY_COLOR} />
          {showCombined && (
            <circle cx={cursorX} cy={PAD_T + ((yMax - curCombined) / (yMax - yMin)) * PLOT_H} r={4} fill={COMBINED_COLOR} />
          )}

          {/* PMS / PMI labels */}
          {[0, 360, 720].map((deg) => {
            const x = PAD_L + (deg / 720) * PLOT_W;
            return (
              <text key={`pms-${deg}`} x={x} y={PAD_T - 6} textAnchor="middle" fontSize={9} fontWeight={600} fill="#9CA3AF">
                PMS
              </text>
            );
          })}
          {[180, 540].map((deg) => {
            const x = PAD_L + (deg / 720) * PLOT_W;
            return (
              <text key={`pmi-${deg}`} x={x} y={PAD_T - 6} textAnchor="middle" fontSize={9} fontWeight={600} fill="#6B7280">
                PMI
              </text>
            );
          })}
        </svg>
      </div>

      {/* Legend + current values */}
      <div className="flex flex-wrap gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 rounded" style={{ backgroundColor: PRIMARY_COLOR }} />
          <span className="text-gray-400">Primaria:</span>
          <span className="font-mono text-gray-200">{curPrimary.toFixed(3)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 rounded" style={{ backgroundColor: SECONDARY_COLOR }} />
          <span className="text-gray-400">Secundaria:</span>
          <span className="font-mono text-gray-200">{curSecondary.toFixed(3)}</span>
        </div>
        {showCombined && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 rounded border border-dashed" style={{ borderColor: COMBINED_COLOR }} />
            <span className="text-gray-400">Combinada:</span>
            <span className="font-mono text-gray-200">{curCombined.toFixed(3)}</span>
          </div>
        )}
      </div>

      {/* Explanation box */}
      <div className="mt-8 max-w-3xl p-4 bg-gray-800/60 rounded-lg border border-gray-700/50">
        <h4 className="text-white font-semibold mb-2">¿Por qué importa la asimetría?</h4>
        <p className="text-gray-300 text-sm leading-relaxed">
          La fuerza combinada es mayor en el PMS que en el PMI. Esto significa que las vibraciones
          no se cancelan perfectamente en un monocilíndrico: la fuerza que empuja al pistón hacia
          abajo desde el PMS es mayor que la que lo empuja hacia arriba desde el PMI.
          Cuanto mayor sea <em>&lambda;</em> (biela más corta respecto al radio del cigüeñal),
          más pronunciada será esta asimetría y mayores serán las fuerzas secundarias a equilibrar.
        </p>
      </div>
    </SectionWrapper>
  );
}
