import { useState } from 'react';
import { pistonPosition, EXPLOSION_COLOR } from '../../utils/engine';
import { useAnimationLoop } from '../../hooks/useAnimationLoop';
import SectionWrapper from '../SectionWrapper';
import AnimationControls from '../AnimationControls';

/* ── Phase helpers ────────────────────────────────────── */

interface Phase {
  name: string;
  color: string;
  fill: string;
}

const PHASES_4T: Phase[] = [
  { name: 'Admisión',   color: '#378ADD', fill: 'rgba(55,138,221,0.25)' },
  { name: 'Compresión', color: '#EAC84B', fill: 'rgba(234,200,75,0.25)' },
  { name: 'Explosión',  color: EXPLOSION_COLOR, fill: 'rgba(239,159,39,0.35)' },
  { name: 'Escape',     color: '#9CA3AF', fill: 'rgba(156,163,175,0.20)' },
];

const PHASES_2T: Phase[] = [
  { name: 'Compresión / Explosión', color: EXPLOSION_COLOR, fill: 'rgba(239,159,39,0.30)' },
  { name: 'Admisión / Escape',      color: '#378ADD',       fill: 'rgba(55,138,221,0.25)' },
];

function get4TPhase(angle720: number): { phase: Phase; index: number } {
  const idx = Math.min(Math.floor(angle720 / 180), 3);
  return { phase: PHASES_4T[idx], index: idx };
}

function get2TPhase(angle360: number): { phase: Phase; index: number } {
  const idx = angle360 < 180 ? 0 : 1;
  return { phase: PHASES_2T[idx], index: idx };
}

/* ── Cylinder SVG ─────────────────────────────────────── */

const CYL_W = 120;
const CYL_H = 160;
const PISTON_H = 30;
const STROKE = CYL_H - PISTON_H;

interface CylinderProps {
  pistonY: number; // 0=TDC 1=BDC
  fillColor: string;
  isFiring: boolean;
  label: string;
  phaseColor: string;
}

function Cylinder({ pistonY, fillColor, isFiring, label, phaseColor }: CylinderProps) {
  const topY = 0;
  const pistonTop = topY + pistonY * STROKE;

  return (
    <g>
      {/* Gas fill above piston */}
      <rect
        x={0} y={topY} width={CYL_W} height={pistonTop}
        fill={fillColor}
        rx={2}
      />
      {/* Explosion glow */}
      {isFiring && (
        <rect
          x={0} y={topY} width={CYL_W} height={pistonTop}
          fill={EXPLOSION_COLOR} opacity={0.5}
          rx={2}
        >
          <animate attributeName="opacity" values="0.5;0.2;0.5" dur="0.3s" repeatCount="indefinite" />
        </rect>
      )}
      {/* Cylinder walls */}
      <rect
        x={0} y={topY} width={CYL_W} height={CYL_H}
        fill="none" stroke="#6B7280" strokeWidth={2}
        rx={4}
      />
      {/* Piston */}
      <rect
        x={4} y={pistonTop} width={CYL_W - 8} height={PISTON_H}
        fill="#D1D5DB" stroke="#9CA3AF" strokeWidth={1.5}
        rx={3}
      />
      {/* Connecting rod */}
      <line
        x1={CYL_W / 2} y1={pistonTop + PISTON_H}
        x2={CYL_W / 2} y2={CYL_H + 20}
        stroke="#9CA3AF" strokeWidth={3} strokeLinecap="round"
      />
      {/* Phase label */}
      <text
        x={CYL_W / 2} y={CYL_H + 48}
        textAnchor="middle" fontSize={13} fontWeight={600}
        fill={phaseColor}
      >
        {label}
      </text>
    </g>
  );
}

/* ── TDC indicator ────────────────────────────────────── */

interface TDCMarkerProps {
  isFiring: boolean;
  x: number;
  y: number;
}

function TDCMarker({ isFiring, x, y }: TDCMarkerProps) {
  return (
    <g>
      <circle cx={x} cy={y} r={8} fill={isFiring ? EXPLOSION_COLOR : '#4B5563'} />
      <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fontSize={9} fontWeight={700} fill={isFiring ? '#000' : '#D1D5DB'}>
        {isFiring ? '!' : '-'}
      </text>
      <text x={x + 14} y={y + 1} textAnchor="start" dominantBaseline="middle" fontSize={10} fill={isFiring ? EXPLOSION_COLOR : '#6B7280'}>
        {isFiring ? 'PMS con explosión' : 'PMS sin explosión'}
      </text>
    </g>
  );
}

/* ── Main component ───────────────────────────────────── */

export default function S04Ciclos() {
  const [speed, setSpeed] = useState(1);
  const { angle, playing, toggle } = useAnimationLoop(speed);

  const angle720 = angle % 720;
  const angle360 = angle % 360;

  const { phase: phase4T } = get4TPhase(angle720);
  const { phase: phase2T } = get2TPhase(angle360);

  const piston4T = pistonPosition(angle720);
  const piston2T = pistonPosition(angle360);

  // 4T: firing TDC near 360° (compresión->explosión), non-firing near 0°/720° (escape->admisión)
  const nearFiringTDC4T = angle720 > 340 && angle720 < 380;
  // nearNonFiringTDC4T removed (unused)

  // 2T: every TDC is firing
  const nearTDC2T = angle360 < 20 || angle360 > 340;

  const revolution4T = Math.floor(angle720 / 360) + 1;

  // Stroke counter
  const strokeNum4T = Math.floor(angle720 / 180) + 1;

  return (
    <SectionWrapper id="ciclos" title="Ciclos: 2T y 4T">
      <p className="text-gray-300 max-w-3xl mb-6">
        El motor de <strong className="text-white">4 tiempos</strong> necesita <strong className="text-white">720 grados</strong> (dos vueltas completas del
        cigüeñal) para completar un ciclo. Solo una de las dos pasadas por el PMS produce explosión.
        El motor de <strong className="text-white">2 tiempos</strong> completa el ciclo en <strong className="text-white">360 grados</strong>: cada vez
        que el pistón llega al PMS hay explosión.
      </p>

      <AnimationControls
        playing={playing}
        onToggle={toggle}
        speed={speed}
        onSpeedChange={setSpeed}
        angle={angle}
      />

      <div className="flex flex-col lg:flex-row gap-10 mt-8 justify-center">
        {/* ── 4 TIEMPOS ─────────────────────── */}
        <div className="flex flex-col items-center">
          <h3 className="text-xl font-semibold text-white mb-1">Motor 4 Tiempos</h3>
          <p className="text-gray-500 text-sm mb-4">720° por ciclo &middot; Vuelta {revolution4T}/2 &middot; Tiempo {strokeNum4T}/4</p>

          <svg width={300} height={280} viewBox="-40 -10 300 280">
            {/* Cylinder */}
            <g transform="translate(50,0)">
              <Cylinder
                pistonY={piston4T}
                fillColor={phase4T.fill}
                isFiring={nearFiringTDC4T}
                label={phase4T.name}
                phaseColor={phase4T.color}
              />
            </g>

            {/* TDC markers */}
            <g transform="translate(12,230)">
              <TDCMarker isFiring={true} x={0} y={0} />
              <TDCMarker isFiring={false} x={0} y={22} />
            </g>
          </svg>

          {/* Phase bar */}
          <div className="flex w-[280px] h-6 rounded overflow-hidden mt-2">
            {PHASES_4T.map((p, i) => {
              const active = Math.floor(angle720 / 180) === i;
              return (
                <div
                  key={i}
                  className="flex-1 flex items-center justify-center text-[10px] font-semibold transition-all duration-200"
                  style={{
                    backgroundColor: active ? p.color : '#1F2937',
                    color: active ? '#000' : '#6B7280',
                    opacity: active ? 1 : 0.5,
                  }}
                >
                  {p.name}
                </div>
              );
            })}
          </div>

          {/* Angle bar */}
          <div className="relative w-[280px] h-2 bg-gray-800 rounded mt-2">
            <div
              className="absolute top-0 h-full bg-orange-500 rounded transition-none"
              style={{ width: `${(angle720 / 720) * 100}%` }}
            />
          </div>
          <div className="flex justify-between w-[280px] text-[10px] text-gray-500 mt-1">
            <span>0°</span><span>180°</span><span>360°</span><span>540°</span><span>720°</span>
          </div>
        </div>

        {/* ── 2 TIEMPOS ─────────────────────── */}
        <div className="flex flex-col items-center">
          <h3 className="text-xl font-semibold text-white mb-1">Motor 2 Tiempos</h3>
          <p className="text-gray-500 text-sm mb-4">360° por ciclo &middot; Explosión en cada PMS</p>

          <svg width={300} height={280} viewBox="-40 -10 300 280">
            <g transform="translate(50,0)">
              <Cylinder
                pistonY={piston2T}
                fillColor={phase2T.fill}
                isFiring={nearTDC2T}
                label={phase2T.name}
                phaseColor={phase2T.color}
              />
            </g>

            {/* Every TDC fires */}
            <g transform="translate(12,230)">
              <TDCMarker isFiring={true} x={0} y={0} />
              <text x={0} y={26} fontSize={10} fill="#6B7280" textAnchor="start">
                Todo PMS = explosión
              </text>
            </g>
          </svg>

          {/* Phase bar */}
          <div className="flex w-[280px] h-6 rounded overflow-hidden mt-2">
            {PHASES_2T.map((p, i) => {
              const active = (angle360 < 180 ? 0 : 1) === i;
              return (
                <div
                  key={i}
                  className="flex-1 flex items-center justify-center text-[10px] font-semibold transition-all duration-200"
                  style={{
                    backgroundColor: active ? p.color : '#1F2937',
                    color: active ? '#000' : '#6B7280',
                    opacity: active ? 1 : 0.5,
                  }}
                >
                  {p.name}
                </div>
              );
            })}
          </div>

          {/* Angle bar */}
          <div className="relative w-[280px] h-2 bg-gray-800 rounded mt-2">
            <div
              className="absolute top-0 h-full bg-orange-500 rounded transition-none"
              style={{ width: `${(angle360 / 360) * 100}%` }}
            />
          </div>
          <div className="flex justify-between w-[280px] text-[10px] text-gray-500 mt-1">
            <span>0°</span><span>180°</span><span>360°</span>
          </div>
        </div>
      </div>

      {/* Summary table */}
      <div className="mt-10 max-w-2xl mx-auto">
        <table className="w-full text-sm text-gray-300 border border-gray-700 rounded overflow-hidden">
          <thead>
            <tr className="bg-gray-800">
              <th className="px-4 py-2 text-left"></th>
              <th className="px-4 py-2 text-center">4 Tiempos</th>
              <th className="px-4 py-2 text-center">2 Tiempos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            <tr><td className="px-4 py-2 text-gray-400">Grados por ciclo</td><td className="px-4 py-2 text-center text-white">720°</td><td className="px-4 py-2 text-center text-white">360°</td></tr>
            <tr><td className="px-4 py-2 text-gray-400">Explosiones / vuelta</td><td className="px-4 py-2 text-center text-white">0.5</td><td className="px-4 py-2 text-center text-white">1</td></tr>
            <tr><td className="px-4 py-2 text-gray-400">Tiempos diferenciados</td><td className="px-4 py-2 text-center text-white">4 (A-C-E-E)</td><td className="px-4 py-2 text-center text-white">2 combinados</td></tr>
            <tr><td className="px-4 py-2 text-gray-400">PMS con explosión</td><td className="px-4 py-2 text-center text-white">1 de cada 2</td><td className="px-4 py-2 text-center text-white">Todos</td></tr>
          </tbody>
        </table>
      </div>
    </SectionWrapper>
  );
}
