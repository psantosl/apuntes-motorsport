import { useState, useMemo } from 'react';
import SectionWrapper from '../SectionWrapper';
import AnimationControls from '../AnimationControls';
import { useAnimationLoop } from '../../hooks/useAnimationLoop';
import { PISTON_COLORS, EXPLOSION_COLOR } from '../../utils/engine';

/* ── Pulse patterns (based on Honda NSR500 V4 2T) ── */
// Screamer: evenly spaced pulses (180° crank, no bank split → 90-90-90-90)
const SCREAMER_PULSES = [0, 90, 180, 270];
// Big Bang: 0° crank + 180° bank split → pairs fire together, 68° between banks
// Pattern: 0°, 0°, 68°, 68° → then 292° gap
const BIGBANG_PULSES = [0, 0, 68, 68];

/* ── SVG constants ── */
const TIRE_VB_W = 600;
const TIRE_VB_H = 280;
const CHART_VB_W = 600;
const CHART_VB_H = 200;

/* ── Helper: is angle near any pulse? ── */
function isPulseActive(angle: number, pulses: number[], threshold = 20): boolean {
  const a = ((angle % 360) + 360) % 360;
  return pulses.some(p => {
    const diff = Math.abs(a - p);
    return diff < threshold || diff > 360 - threshold;
  });
}

/* ── Helper: pulse intensity (0..1) ── */
function pulseIntensity(angle: number, pulses: number[], width = 20): number {
  const a = ((angle % 360) + 360) % 360;
  let maxI = 0;
  for (const p of pulses) {
    const diff = Math.min(Math.abs(a - p), 360 - Math.abs(a - p));
    if (diff < width) {
      maxI = Math.max(maxI, 1 - diff / width);
    }
  }
  return maxI;
}

/* ── Generate power chart path ── */
function powerChartPath(
  pulses: number[],
  width: number,
  ox: number,
  oy: number,
  w: number,
  h: number,
  cycles = 2
): string {
  const points: string[] = [];
  const totalDeg = 360 * cycles;
  const steps = 300;
  for (let i = 0; i <= steps; i++) {
    const deg = (i / steps) * totalDeg;
    let val = 0;
    for (let c = 0; c < cycles; c++) {
      for (const p of pulses) {
        const pDeg = p + c * 360;
        const diff = Math.abs(deg - pDeg);
        if (diff < width) {
          val += Math.pow(1 - diff / width, 2);
        }
      }
    }
    val = Math.min(val, 1);
    const x = ox + (i / steps) * w;
    const y = oy + h - val * (h * 0.85);
    points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return points.join(' ');
}

/* ── Tire SVG component ── */
function TireVisualization({
  label,
  angle,
  pulses,
  color,
  cx,
  cy,
}: {
  label: string;
  angle: number;
  pulses: number[];
  color: string;
  cx: number;
  cy: number;
}) {
  const intensity = pulseIntensity(angle, pulses, 25);
  const active = intensity > 0.1;

  // Tire deformation: when pulse hits, tire squishes (wider + shorter)
  const deformX = 1 + intensity * 0.08;
  const deformY = 1 - intensity * 0.06;

  // Glow
  const glowOpacity = intensity * 0.6;

  // Base tire radii
  const rx = 55;
  const ry = 75;

  return (
    <g>
      {/* Label */}
      <text x={cx} y={cy - 105} fill="#D1D5DB" fontSize={14} fontWeight={700} textAnchor="middle">
        {label}
      </text>

      {/* Ground line */}
      <line
        x1={cx - 80} y1={cy + ry + 8}
        x2={cx + 80} y2={cy + ry + 8}
        stroke="#4B5563" strokeWidth={2}
      />

      {/* Glow effect behind tire */}
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx * deformX + 8}
        ry={ry * deformY + 8}
        fill="none"
        stroke={active ? EXPLOSION_COLOR : color}
        strokeWidth={3}
        opacity={active ? glowOpacity : 0.15}
      />

      {/* Tire body */}
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx * deformX}
        ry={ry * deformY}
        fill="#1F2937"
        stroke={color}
        strokeWidth={2.5}
      />

      {/* Inner tread marks */}
      {[0, 1, 2, 3, 4, 5].map(i => {
        const a = (i / 6) * Math.PI * 2;
        const innerRx = (rx - 12) * deformX;
        const innerRy = (ry - 12) * deformY;
        return (
          <line
            key={i}
            x1={cx + Math.cos(a) * innerRx * 0.7}
            y1={cy + Math.sin(a) * innerRy * 0.7}
            x2={cx + Math.cos(a) * innerRx}
            y2={cy + Math.sin(a) * innerRy}
            stroke="#374151"
            strokeWidth={2}
          />
        );
      })}

      {/* Contact patch (bottom of tire) — stretches with deformation */}
      <rect
        x={cx - (20 + intensity * 12)}
        y={cy + ry * deformY - 4}
        width={(40 + intensity * 24)}
        height={8}
        rx={3}
        fill={active ? EXPLOSION_COLOR : '#6B7280'}
        opacity={active ? 0.7 + intensity * 0.3 : 0.4}
      />

      {/* Pulse indicator */}
      {active && (
        <g>
          <text
            x={cx} y={cy + ry + 30}
            fill={EXPLOSION_COLOR} fontSize={11} textAnchor="middle" fontWeight={600}
            opacity={intensity}
          >
            PULSO
          </text>
        </g>
      )}
    </g>
  );
}

export default function S10BigBang() {
  const [speed, setSpeed] = useState(1);
  const { angle, playing, toggle } = useAnimationLoop(speed);

  // Chart data
  const screamerPath = useMemo(
    () => powerChartPath(SCREAMER_PULSES, 35, 50, 20, 500, 140, 2),
    []
  );
  const bigBangPath = useMemo(
    () => powerChartPath(BIGBANG_PULSES, 35, 50, 20, 500, 140, 2),
    []
  );

  // Animated cursor position on chart
  const chartProgress = ((angle % 720) / 720);
  const cursorX = 50 + chartProgress * 500;

  return (
    <SectionWrapper id="s10-big-bang" title="10 · Big Bang vs Screamer">
      <p className="text-gray-400 max-w-2xl mb-6">
        El <strong className="text-white">orden de encendido</strong> afecta directamente a cómo el
        neumático trasero gestiona la tracción. Un motor <em>screamer</em> entrega potencia de forma
        casi continua, mientras que un <em>big bang</em> agrupa las explosiones y deja pausas donde el
        neumático se recupera.
      </p>

      {/* ── Tire visualization ── */}
      <div className="flex flex-col items-center gap-4 mb-8">
        <svg
          viewBox={`0 0 ${TIRE_VB_W} ${TIRE_VB_H}`}
          className="w-full max-w-2xl"
          style={{ minHeight: 240 }}
        >
          <TireVisualization
            label="Screamer (uniforme)"
            angle={angle}
            pulses={SCREAMER_PULSES}
            color={PISTON_COLORS[2]}
            cx={150}
            cy={135}
          />
          <TireVisualization
            label="Big Bang (agrupado)"
            angle={angle}
            pulses={BIGBANG_PULSES}
            color={PISTON_COLORS[3]}
            cx={450}
            cy={135}
          />

          {/* VS divider */}
          <text x={300} y={145} fill="#6B7280" fontSize={18} fontWeight={700} textAnchor="middle">
            vs
          </text>
        </svg>
      </div>

      {/* ── Power delivery chart ── */}
      <div className="flex flex-col items-center gap-4 mb-8">
        <h3 className="text-lg text-gray-300 font-semibold">Entrega de potencia al neumático</h3>
        <svg
          viewBox={`0 0 ${CHART_VB_W} ${CHART_VB_H}`}
          className="w-full max-w-2xl bg-gray-800/30 rounded-lg"
          style={{ minHeight: 180 }}
        >
          {/* Axes */}
          <line x1={50} y1={170} x2={555} y2={170} stroke="#4B5563" strokeWidth={1} />
          <line x1={50} y1={15} x2={50} y2={170} stroke="#4B5563" strokeWidth={1} />
          <text x={300} y={192} fill="#6B7280" fontSize={11} textAnchor="middle">Tiempo (grados de cigüeñal)</text>
          <text x={16} y={95} fill="#6B7280" fontSize={11} textAnchor="middle" transform="rotate(-90,16,95)">Potencia</text>

          {/* Grid lines */}
          {[0, 90, 180, 270, 360, 450, 540, 630, 720].map(deg => {
            const x = 50 + (deg / 720) * 500;
            return (
              <g key={deg}>
                <line x1={x} y1={15} x2={x} y2={170} stroke="#374151" strokeWidth={0.5} />
                <text x={x} y={182} fill="#4B5563" fontSize={8} textAnchor="middle">{deg}°</text>
              </g>
            );
          })}

          {/* Screamer curve */}
          <path d={screamerPath} fill="none" stroke={PISTON_COLORS[2]} strokeWidth={2} opacity={0.8} />
          {/* Big Bang curve */}
          <path d={bigBangPath} fill="none" stroke={PISTON_COLORS[3]} strokeWidth={2} opacity={0.8} />

          {/* Animated cursor */}
          <line x1={cursorX} y1={15} x2={cursorX} y2={170} stroke="#EF9F27" strokeWidth={1.5} opacity={0.5} strokeDasharray="4 3" />

          {/* Legend */}
          <rect x={380} y={25} width={12} height={3} fill={PISTON_COLORS[2]} rx={1} />
          <text x={396} y={30} fill={PISTON_COLORS[2]} fontSize={10}>Screamer</text>
          <rect x={380} y={40} width={12} height={3} fill={PISTON_COLORS[3]} rx={1} />
          <text x={396} y={45} fill={PISTON_COLORS[3]} fontSize={10}>Big Bang</text>
        </svg>
      </div>

      {/* ── Animation controls ── */}
      <div className="flex justify-center mb-10">
        <AnimationControls
          playing={playing}
          onToggle={toggle}
          speed={speed}
          onSpeedChange={setSpeed}
          angle={angle % 360}
        />
      </div>

      {/* ── Historical context ── */}
      <div className="max-w-2xl space-y-4">
        <h3 className="text-lg text-gray-300 font-semibold">Contexto histórico</h3>
        <div className="bg-gray-800/40 rounded-lg p-5 space-y-3 text-gray-400 text-sm leading-relaxed">
          <p>
            A principios de los <strong className="text-white">años 90</strong>, las 500cc 2T de MotoGP
            utilizaban motores <em>screamer</em> con encendidos uniformemente espaciados. El motor era
            teóricamente más potente, pero la entrega continua de par hacía que el neumático trasero
            patinase de forma impredecible.
          </p>
          <p>
            <strong className="text-white">Yamaha</strong> introdujo el concepto
            <strong className="text-orange-400"> Big Bang</strong> alrededor de{' '}
            <strong className="text-white">1992</strong> con{' '}
            <strong className="text-white">Wayne Rainey</strong>. Agrupando los encendidos, el neumático
            tenía momentos de &ldquo;descanso&rdquo; entre grupos de explosiones, lo que permitía al
            piloto modular la tracción con mayor precisión.
          </p>
          <p>
            El <em>screamer</em> era más rápido en punta, pero inmanejable en curva. El Big Bang
            sacrificaba algo de potencia pico a cambio de una{' '}
            <strong className="text-white">tracción muy superior</strong>.
          </p>
          <p>
            En la era moderna de MotoGP (4T), la{' '}
            <strong className="text-white">Yamaha M1</strong> con su motor I4{' '}
            <strong className="text-orange-400">crossplane</strong> (cigüeñal con muñequillas a 90°)
            es la heredera directa de esta filosofía: un orden de encendido irregular que produce una
            entrega de par similar al Big Bang, facilitando la gestión del neumático.
          </p>
        </div>
      </div>
    </SectionWrapper>
  );
}
