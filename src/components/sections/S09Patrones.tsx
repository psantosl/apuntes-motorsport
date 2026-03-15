import { useState, useMemo } from 'react';
import SectionWrapper from '../SectionWrapper';
import AnimationControls from '../AnimationControls';
import { useAnimationLoop } from '../../hooks/useAnimationLoop';
import {
  pistonPosition,
  isAtTDC,
  isFiringTDC4T,
  isFiring2T,
  PISTON_COLORS,
  EXPLOSION_COLOR,
  I4_OFFSETS,
  I4_FIRING_OFFSETS_4T,
  SCREAMER_2T_OFFSETS,
  BIGBANG_2T_OFFSETS,
} from '../../utils/engine';

/* ── Tabs ── */
type TabKey = 'i4-4t' | 'screamer' | 'bigbang';

interface Config {
  label: string;
  crankOffsets: number[];
  is4T: boolean;
  firingOffsets4T?: number[];   // only for 4T
  cycleDeg: number;             // 720 for 4T, 360 for 2T
  description: string;
}

const CONFIGS: Record<TabKey, Config> = {
  'i4-4t': {
    label: 'I4 4T',
    crankOffsets: I4_OFFSETS,
    is4T: true,
    firingOffsets4T: I4_FIRING_OFFSETS_4T,
    cycleDeg: 720,
    description:
      'Motor 4 tiempos clasico: cada piston llega al PMS dos veces por ciclo (720°). ' +
      'Solo una es explosion (naranja), la otra es cruce de escape (gris). ' +
      'Orden de encendido: 1-3-4-2, con 180° entre explosiones.',
  },
  screamer: {
    label: 'I4 2T Screamer',
    crankOffsets: SCREAMER_2T_OFFSETS,
    is4T: false,
    cycleDeg: 360,
    description:
      'Configuracion screamer: los 4 cilindros estan separados exactamente 90°. ' +
      'Cada 90° de ciguenal hay una explosion, perfectamente espaciadas. ' +
      'Entrega de potencia muy uniforme, como un I4 de 4 tiempos.',
  },
  bigbang: {
    label: 'I4 2T Big Bang',
    crankOffsets: BIGBANG_2T_OFFSETS,
    is4T: false,
    cycleDeg: 360,
    description:
      'Configuracion big bang: las explosiones se agrupan en pares. ' +
      'P1+P2 explotan casi juntos (70° de separacion), pausa de ~110°, luego P3+P4 ' +
      'casi juntos (70°), pausa de ~110°. Mejor traccion en mojado gracias a la ' +
      'entrega irregular de potencia.',
  },
};

/* ── SVG geometry ── */
const NUM = 4;
const P_W = 52;
const P_H = 32;
const GAP = 18;
const CYL_H = 110;
const CYL_TOP = 36;
const TOTAL_W = NUM * P_W + (NUM - 1) * GAP;
const MARGIN_X = 30;
const VB_W = TOTAL_W + MARGIN_X * 2;
const ANIM_H = CYL_TOP + CYL_H + 30;

/* ── Timeline geometry ── */
const TL_W = VB_W;
const TL_ROW_H = 22;
const TL_TOP = 12;
const TL_PAD_L = MARGIN_X;
const TL_PAD_R = 20;
const TL_PLOT_W = TL_W - TL_PAD_L - TL_PAD_R;
const TL_H = TL_TOP + NUM * TL_ROW_H + 24;

/* ── Explosion flash radius ── */
const FLASH_R = 18;

/* Pre-compute explosion event positions for the timeline */
function computeEvents(config: Config): Array<{ piston: number; deg: number; firing: boolean }> {
  const events: Array<{ piston: number; deg: number; firing: boolean }> = [];
  const step = 1;
  for (let deg = 0; deg < config.cycleDeg; deg += step) {
    for (let i = 0; i < NUM; i++) {
      const offset = config.crankOffsets[i];
      const atTDC = isAtTDC(deg, offset, step / 2 + 0.5);
      if (!atTDC) continue;

      if (config.is4T && config.firingOffsets4T) {
        const firing = isFiringTDC4T(deg, config.firingOffsets4T[i], step / 2 + 0.5);
        events.push({ piston: i, deg, firing });
      } else {
        // 2T: every TDC fires
        events.push({ piston: i, deg, firing: true });
      }
    }
  }

  // Deduplicate: keep one event per piston per TDC zone
  const deduped: typeof events = [];
  for (const ev of events) {
    const last = deduped.findLast((e) => e.piston === ev.piston);
    if (last && Math.abs(last.deg - ev.deg) < 10) {
      // merge: keep firing=true if either is
      if (ev.firing) last.firing = true;
      continue;
    }
    deduped.push({ ...ev });
  }
  return deduped;
}

export default function S09Patrones() {
  const [speed, setSpeed] = useState(1);
  const [tab, setTab] = useState<TabKey>('i4-4t');
  const { angle, playing, toggle } = useAnimationLoop(speed);

  const config = CONFIGS[tab];
  const cycleDeg = config.cycleDeg;
  const crankAngle = angle % cycleDeg;

  // Piston state
  const pistons = config.crankOffsets.map((offset, i) => {
    const pos = pistonPosition(crankAngle + offset);
    const atTDC = isAtTDC(crankAngle, offset, 18);

    let firing = false;
    if (config.is4T && config.firingOffsets4T) {
      firing = atTDC && isFiringTDC4T(crankAngle, config.firingOffsets4T[i], 18);
    } else {
      firing = isFiring2T(crankAngle, offset, 18);
    }

    const nonFiringTDC = atTDC && !firing;
    const color = PISTON_COLORS[(i + 1) as 1 | 2 | 3 | 4];
    return { pos, firing, nonFiringTDC, color };
  });

  // Timeline events
  const events = useMemo(() => computeEvents(config), [config]);

  return (
    <SectionWrapper id="s09-patrones" title="9 · Patrones de disparo">
      <p className="text-gray-400 max-w-3xl mb-6">
        El orden y espaciado de las explosiones define el caracter del motor. Compara tres
        configuraciones de 4 cilindros.
      </p>

      {/* ── Tab selector ── */}
      <div className="flex gap-2 mb-6">
        {(Object.keys(CONFIGS) as TabKey[]).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === key
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-gray-500'
            }`}
          >
            {CONFIGS[key].label}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-6">
        {/* ── Piston animation ── */}
        <svg
          viewBox={`0 0 ${VB_W} ${ANIM_H}`}
          className="w-full max-w-xl"
          style={{ minHeight: 220 }}
        >
          {/* Explosion flash defs */}
          <defs>
            <radialGradient id="flash-grad">
              <stop offset="0%" stopColor={EXPLOSION_COLOR} stopOpacity={0.9} />
              <stop offset="70%" stopColor={EXPLOSION_COLOR} stopOpacity={0.3} />
              <stop offset="100%" stopColor={EXPLOSION_COLOR} stopOpacity={0} />
            </radialGradient>
          </defs>

          {pistons.map((p, i) => {
            const x = MARGIN_X + i * (P_W + GAP);
            const cx = x + P_W / 2;
            const pistonY = CYL_TOP + p.pos * (CYL_H - P_H);

            return (
              <g key={`p-${i}`}>
                {/* Piston label */}
                <text
                  x={cx}
                  y={CYL_TOP - 12}
                  textAnchor="middle"
                  fill={p.color}
                  fontSize={11}
                  fontWeight={700}
                >
                  P{i + 1}
                </text>

                {/* Cylinder wall */}
                <rect
                  x={x - 3}
                  y={CYL_TOP}
                  width={P_W + 6}
                  height={CYL_H}
                  rx={2}
                  fill="none"
                  stroke="#4B5563"
                  strokeWidth={1.5}
                />

                {/* Explosion flash */}
                {p.firing && (
                  <circle
                    cx={cx}
                    cy={CYL_TOP + 10}
                    r={FLASH_R}
                    fill="url(#flash-grad)"
                  />
                )}

                {/* Non-firing TDC indicator (dim) */}
                {p.nonFiringTDC && (
                  <circle
                    cx={cx}
                    cy={CYL_TOP + 10}
                    r={10}
                    fill="#60A5FA"
                    opacity={0.2}
                  />
                )}

                {/* Piston body */}
                <rect
                  x={x}
                  y={pistonY}
                  width={P_W}
                  height={P_H}
                  rx={3}
                  fill={p.firing ? EXPLOSION_COLOR : p.color}
                  opacity={p.firing ? 1 : 0.9}
                  stroke={p.firing ? '#FCD34D' : 'none'}
                  strokeWidth={p.firing ? 2 : 0}
                />
              </g>
            );
          })}
        </svg>

        {/* ── Timeline ── */}
        <div className="w-full max-w-xl">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">
            Linea temporal — ciclo completo ({cycleDeg}°)
          </h3>
          <svg viewBox={`0 0 ${TL_W} ${TL_H}`} className="w-full bg-gray-800/40 rounded-lg">
            {/* Degree markers */}
            {Array.from(
              { length: Math.floor(cycleDeg / 90) + 1 },
              (_, k) => k * 90
            ).map((deg) => {
              const x = TL_PAD_L + (deg / cycleDeg) * TL_PLOT_W;
              return (
                <g key={`deg-${deg}`}>
                  <line
                    x1={x}
                    y1={TL_TOP}
                    x2={x}
                    y2={TL_TOP + NUM * TL_ROW_H}
                    stroke="#374151"
                    strokeWidth={0.8}
                  />
                  <text
                    x={x}
                    y={TL_TOP + NUM * TL_ROW_H + 14}
                    textAnchor="middle"
                    fill="#6B7280"
                    fontSize={8}
                  >
                    {deg}°
                  </text>
                </g>
              );
            })}

            {/* Piston rows */}
            {Array.from({ length: NUM }, (_, i) => {
              const rowY = TL_TOP + i * TL_ROW_H + TL_ROW_H / 2;
              const color = PISTON_COLORS[(i + 1) as 1 | 2 | 3 | 4];
              return (
                <g key={`row-${i}`}>
                  {/* Row label */}
                  <text
                    x={TL_PAD_L - 8}
                    y={rowY + 4}
                    textAnchor="end"
                    fill={color}
                    fontSize={10}
                    fontWeight={600}
                  >
                    P{i + 1}
                  </text>
                  {/* Row background line */}
                  <line
                    x1={TL_PAD_L}
                    y1={rowY}
                    x2={TL_PAD_L + TL_PLOT_W}
                    y2={rowY}
                    stroke="#374151"
                    strokeWidth={1}
                    opacity={0.5}
                  />
                </g>
              );
            })}

            {/* Event markers */}
            {events.map((ev, idx) => {
              const x = TL_PAD_L + (ev.deg / cycleDeg) * TL_PLOT_W;
              const y = TL_TOP + ev.piston * TL_ROW_H + TL_ROW_H / 2;
              return (
                <circle
                  key={idx}
                  cx={x}
                  cy={y}
                  r={6}
                  fill={ev.firing ? EXPLOSION_COLOR : '#6B7280'}
                  opacity={ev.firing ? 0.9 : 0.4}
                  stroke={ev.firing ? '#FCD34D' : '#4B5563'}
                  strokeWidth={1}
                />
              );
            })}

            {/* Current position cursor */}
            <line
              x1={TL_PAD_L + (crankAngle / cycleDeg) * TL_PLOT_W}
              y1={TL_TOP - 4}
              x2={TL_PAD_L + (crankAngle / cycleDeg) * TL_PLOT_W}
              y2={TL_TOP + NUM * TL_ROW_H + 4}
              stroke="#F87171"
              strokeWidth={2}
              opacity={0.7}
            />
          </svg>

          {/* Legend */}
          <div className="flex gap-4 mt-2 text-xs text-gray-500 justify-center">
            <span className="flex items-center gap-1">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: EXPLOSION_COLOR }}
              />
              Explosion
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full bg-gray-600" />
              PMS sin explosion
            </span>
          </div>
        </div>

        <AnimationControls
          playing={playing}
          onToggle={toggle}
          speed={speed}
          onSpeedChange={setSpeed}
          angle={crankAngle}
        />
      </div>

      {/* ── Description per mode ── */}
      <div className="mt-8 max-w-3xl">
        <p className="text-gray-400">{config.description}</p>

        {tab === 'bigbang' && (
          <div className="mt-4 bg-gray-800/40 border border-orange-500/20 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-orange-400 mb-2">
              Por que el Big Bang mejora la traccion?
            </h4>
            <p className="text-gray-400 text-sm">
              Al agrupar las explosiones en pares, el neumatico trasero tiene intervalos mas
              largos sin par motor. Esto permite que el caucho se recupere entre pulsos de
              potencia, reduciendo el deslizamiento en condiciones de baja adherencia. Es la
              misma filosofia que llevo a Yamaha a cambiar el orden de encendido de la YZR-M1
              de MotoGP.
            </p>
          </div>
        )}
      </div>
    </SectionWrapper>
  );
}
