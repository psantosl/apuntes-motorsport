import { useState } from 'react';
import SectionWrapper from '../SectionWrapper';
import AnimationControls from '../AnimationControls';
import { useAnimationLoop } from '../../hooks/useAnimationLoop';
import { pistonPosition, PISTON_COLORS } from '../../utils/engine';

/* ── geometry constants (SVG user units) ── */
const VB_W = 400;
const VB_H = 500;

const CYL_X = 130;            // cylinder left wall x
const CYL_W = 140;            // cylinder bore width
const CYL_TOP = 60;           // top of cylinder (culata bottom)
const CYL_BOT = 310;          // bottom of cylinder walls
const STROKE = CYL_BOT - CYL_TOP - 40; // max vertical travel

const PISTON_H = 36;
const PISTON_COLOR = PISTON_COLORS[1];

const CRANK_CX = CYL_X + CYL_W / 2; // crankshaft center
const CRANK_CY = 400;
const CRANK_R = 40;            // crank radius (muñequilla offset)

/* ── label type ── */
interface Label {
  text: string;
  tx: number; ty: number;  // text position
  px: number; py: number;  // point-to position
}

export default function S01Cilindro() {
  const [speed, setSpeed] = useState(1);
  const { angle, playing, toggle } = useAnimationLoop(speed);

  const pos = pistonPosition(angle % 360); // 0 = TDC, 1 = BDC
  const pistonY = CYL_TOP + 20 + pos * STROKE;

  // crankshaft pin position
  const crankRad = ((angle % 360) * Math.PI) / 180;
  const pinX = CRANK_CX + CRANK_R * Math.sin(crankRad);
  const pinY = CRANK_CY - CRANK_R * Math.cos(crankRad);

  // biela bottom = pin, top = piston wrist pin (bulón)
  const bulonY = pistonY + PISTON_H / 2;
  const bulonX = CRANK_CX;

  // TDC / BDC y positions
  const tdcY = CYL_TOP + 20;
  const bdcY = CYL_TOP + 20 + STROKE;

  // Labels with pointer positions that update with animation
  const labels: Label[] = [
    { text: 'Culata', tx: 20, ty: 40, px: CYL_X + CYL_W / 2, py: CYL_TOP - 8 },
    { text: 'V. admisión', tx: 10, ty: 75, px: CYL_X + 30, py: CYL_TOP + 4 },
    { text: 'V. escape', tx: 280, ty: 75, px: CYL_X + CYL_W - 30, py: CYL_TOP + 4 },
    { text: 'Pistón', tx: 310, ty: pistonY + 6, px: CYL_X + CYL_W + 4, py: pistonY + PISTON_H / 2 },
    { text: 'Segmentos', tx: 310, ty: pistonY - 16, px: CYL_X + CYL_W + 4, py: pistonY - 4 },
    { text: 'Bulón', tx: 310, ty: bulonY + 18, px: bulonX + 20, py: bulonY },
    { text: 'Biela', tx: 16, ty: (bulonY + pinY) / 2, px: (bulonX + pinX) / 2 - 8, py: (bulonY + pinY) / 2 },
    { text: 'Muñequilla', tx: 10, ty: pinY + 4, px: pinX - 10, py: pinY },
    { text: 'Muñón principal', tx: 10, ty: CRANK_CY + 36, px: CRANK_CX - 14, py: CRANK_CY + 10 },
    { text: 'Brazo de manivela', tx: 10, ty: CRANK_CY + 52, px: (CRANK_CX + pinX) / 2, py: (CRANK_CY + pinY) / 2 },
  ];

  return (
    <SectionWrapper id="s01-cilindro" title="1 · El cilindro">
      <p className="text-gray-400 max-w-2xl mb-6">
        Anatomía del conjunto cilindro-pistón-biela-cigüeñal. El pistón se desplaza entre el
        <strong className="text-white"> PMS</strong> (Punto Muerto Superior) y el
        <strong className="text-white"> PMI</strong> (Punto Muerto Inferior) mientras el cigüeñal gira.
      </p>

      <div className="flex flex-col items-center gap-4">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="w-full max-w-md"
          style={{ minHeight: 420 }}
        >
          {/* ── Culata (head) ── */}
          <rect
            x={CYL_X - 10} y={CYL_TOP - 24}
            width={CYL_W + 20} height={24}
            rx={4}
            fill="#4B5563" stroke="#6B7280" strokeWidth={1.5}
          />

          {/* valves */}
          <line x1={CYL_X + 30} y1={CYL_TOP - 24} x2={CYL_X + 30} y2={CYL_TOP + 6}
            stroke="#60A5FA" strokeWidth={3} strokeLinecap="round" />
          <line x1={CYL_X + CYL_W - 30} y1={CYL_TOP - 24} x2={CYL_X + CYL_W - 30} y2={CYL_TOP + 6}
            stroke="#F87171" strokeWidth={3} strokeLinecap="round" />

          {/* ── Cylinder walls ── */}
          <line x1={CYL_X} y1={CYL_TOP} x2={CYL_X} y2={CYL_BOT}
            stroke="#9CA3AF" strokeWidth={3} />
          <line x1={CYL_X + CYL_W} y1={CYL_TOP} x2={CYL_X + CYL_W} y2={CYL_BOT}
            stroke="#9CA3AF" strokeWidth={3} />

          {/* ── TDC / BDC indicators ── */}
          <line x1={CYL_X - 18} y1={tdcY + PISTON_H / 2} x2={CYL_X - 4} y2={tdcY + PISTON_H / 2}
            stroke="#34D399" strokeWidth={1.5} strokeDasharray="3 2" />
          <text x={CYL_X - 22} y={tdcY + PISTON_H / 2 + 4}
            textAnchor="end" fill="#34D399" fontSize={10} fontWeight={700}>PMS</text>

          <line x1={CYL_X - 18} y1={bdcY + PISTON_H / 2} x2={CYL_X - 4} y2={bdcY + PISTON_H / 2}
            stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="3 2" />
          <text x={CYL_X - 22} y={bdcY + PISTON_H / 2 + 4}
            textAnchor="end" fill="#F59E0B" fontSize={10} fontWeight={700}>PMI</text>

          {/* ── Piston segments (rings) ── */}
          {[0, 8, 14].map((dy, i) => (
            <rect
              key={i}
              x={CYL_X + 4} y={pistonY - 6 + dy}
              width={CYL_W - 8} height={3}
              rx={1}
              fill="#A1A1AA"
            />
          ))}

          {/* ── Piston body ── */}
          <rect
            x={CYL_X + 4} y={pistonY}
            width={CYL_W - 8} height={PISTON_H}
            rx={4}
            fill={PISTON_COLOR} stroke="#1E3A5F" strokeWidth={1.5}
          />

          {/* bulón (wrist pin) */}
          <circle cx={bulonX} cy={bulonY} r={5} fill="#E5E7EB" stroke="#6B7280" strokeWidth={1} />

          {/* ── Biela (connecting rod) ── */}
          <line
            x1={bulonX} y1={bulonY}
            x2={pinX} y2={pinY}
            stroke="#D1D5DB" strokeWidth={5} strokeLinecap="round"
          />

          {/* ── Crankshaft ── */}
          {/* muñón principal (main journal) */}
          <circle cx={CRANK_CX} cy={CRANK_CY} r={14}
            fill="#6B7280" stroke="#4B5563" strokeWidth={2} />

          {/* brazo de manivela (crank arm) */}
          <line
            x1={CRANK_CX} y1={CRANK_CY}
            x2={pinX} y2={pinY}
            stroke="#6B7280" strokeWidth={10} strokeLinecap="round"
          />

          {/* muñequilla (crank pin) */}
          <circle cx={pinX} cy={pinY} r={7}
            fill="#E5E7EB" stroke="#4B5563" strokeWidth={1.5} />

          {/* ── Labels ── */}
          {labels.map((l) => (
            <g key={l.text}>
              <line
                x1={l.tx + l.text.length * 3} y1={l.ty}
                x2={l.px} y2={l.py}
                stroke="#6B728080" strokeWidth={0.8}
              />
              <text
                x={l.tx} y={l.ty}
                fill="#D1D5DB" fontSize={10} fontFamily="sans-serif"
              >
                {l.text}
              </text>
            </g>
          ))}
        </svg>

        <AnimationControls
          playing={playing}
          onToggle={toggle}
          speed={speed}
          onSpeedChange={setSpeed}
          angle={angle % 360}
        />
      </div>
    </SectionWrapper>
  );
}
