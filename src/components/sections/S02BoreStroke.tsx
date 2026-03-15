import { useState, useMemo } from 'react';
import SectionWrapper from '../SectionWrapper';

/* ── SVG layout constants ── */
const VB_W = 420;
const VB_H = 380;
const CX = VB_W / 2;           // cylinder center X
const BASE_Y = 320;             // cylinder bottom line
const SCALE = 1.6;              // mm → SVG units

/* dimension-line arrow head */
function ArrowHead({ id, color }: { id: string; color: string }) {
  return (
    <marker id={id} markerWidth="8" markerHeight="6" refX="4" refY="3" orient="auto">
      <path d="M0,0 L8,3 L0,6 Z" fill={color} />
    </marker>
  );
}

/* Dimension line with arrows at both ends and centered label */
function DimLine({
  x1, y1, x2, y2, label, color, offset = 0, fontSize = 12,
}: {
  x1: number; y1: number; x2: number; y2: number;
  label: string; color: string; offset?: number; fontSize?: number;
}) {
  const id = `arrow-${color.replace('#', '')}`;
  const idR = `${id}-r`;
  const mx = (x1 + x2) / 2 + offset;
  const my = (y1 + y2) / 2;
  const isHoriz = Math.abs(y1 - y2) < 2;

  return (
    <g>
      <defs>
        <ArrowHead id={id} color={color} />
        <marker id={idR} markerWidth="8" markerHeight="6" refX="4" refY="3" orient="auto-start-reverse">
          <path d="M0,0 L8,3 L0,6 Z" fill={color} />
        </marker>
      </defs>
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color} strokeWidth={1.5}
        markerStart={`url(#${idR})`}
        markerEnd={`url(#${id})`}
      />
      <text
        x={mx} y={my + (isHoriz ? -6 : 0)}
        fill={color} fontSize={fontSize} fontWeight={700}
        textAnchor="middle"
        dominantBaseline={isHoriz ? 'auto' : 'middle'}
      >
        {label}
      </text>
    </g>
  );
}

export default function S02BoreStroke() {
  const [bore, setBore] = useState(84);
  const [stroke, setStroke] = useState(90);

  const displacement = useMemo(() => {
    return Math.PI * Math.pow(bore / 2, 2) * stroke; // mm³ → divide by 1000 for cm³
  }, [bore, stroke]);

  const dispCC = displacement / 1000;

  const cylW = bore * SCALE;
  const cylH = stroke * SCALE;
  const cylX = CX - cylW / 2;
  const cylY = BASE_Y - cylH;

  return (
    <SectionWrapper id="s02-bore-stroke" title="2 · Bore, stroke y cilindrada">
      <p className="text-gray-400 max-w-2xl mb-6">
        El <strong className="text-white">diámetro</strong> (bore) y la
        <strong className="text-white"> carrera</strong> (stroke) definen la geometría del cilindro.
        La cilindrada unitaria se calcula como el volumen barrido por el pistón.
      </p>

      {/* ── Sliders ── */}
      <div className="flex flex-wrap gap-8 mb-6 max-w-lg">
        <label className="flex flex-col gap-1 flex-1 min-w-[180px]">
          <span className="text-gray-400 text-sm">
            Bore (diámetro):{' '}
            <span className="text-white font-mono">{bore} mm</span>
          </span>
          <input
            type="range" min={60} max={110} step={1} value={bore}
            onChange={e => setBore(Number(e.target.value))}
            className="accent-sky-500"
          />
        </label>
        <label className="flex flex-col gap-1 flex-1 min-w-[180px]">
          <span className="text-gray-400 text-sm">
            Stroke (carrera):{' '}
            <span className="text-white font-mono">{stroke} mm</span>
          </span>
          <input
            type="range" min={40} max={110} step={1} value={stroke}
            onChange={e => setStroke(Number(e.target.value))}
            className="accent-amber-500"
          />
        </label>
      </div>

      <div className="flex flex-col items-center gap-4">
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full max-w-md" style={{ minHeight: 320 }}>
          {/* cylinder walls */}
          <rect
            x={cylX} y={cylY}
            width={cylW} height={cylH}
            rx={4}
            fill="#37415180" stroke="#9CA3AF" strokeWidth={2}
          />

          {/* piston at bottom */}
          <rect
            x={cylX + 4} y={BASE_Y - 24}
            width={cylW - 8} height={20}
            rx={3}
            fill="#378ADD" stroke="#1E3A5F" strokeWidth={1.5}
          />

          {/* culata (head) at top */}
          <rect
            x={cylX - 6} y={cylY - 14}
            width={cylW + 12} height={14}
            rx={3}
            fill="#4B5563" stroke="#6B7280" strokeWidth={1}
          />

          {/* ── Bore dimension (horizontal) ── */}
          <DimLine
            x1={cylX} y1={cylY - 28}
            x2={cylX + cylW} y2={cylY - 28}
            label={`${bore} mm`}
            color="#38BDF8"
          />
          {/* extension lines */}
          <line x1={cylX} y1={cylY - 14} x2={cylX} y2={cylY - 34}
            stroke="#38BDF850" strokeWidth={0.8} strokeDasharray="3 2" />
          <line x1={cylX + cylW} y1={cylY - 14} x2={cylX + cylW} y2={cylY - 34}
            stroke="#38BDF850" strokeWidth={0.8} strokeDasharray="3 2" />

          {/* ── Stroke dimension (vertical) ── */}
          <DimLine
            x1={cylX + cylW + 30} y1={cylY}
            x2={cylX + cylW + 30} y2={BASE_Y}
            label={`${stroke} mm`}
            color="#F59E0B"
            offset={16}
          />
          {/* extension lines */}
          <line x1={cylX + cylW} y1={cylY} x2={cylX + cylW + 36} y2={cylY}
            stroke="#F59E0B50" strokeWidth={0.8} strokeDasharray="3 2" />
          <line x1={cylX + cylW} y1={BASE_Y} x2={cylX + cylW + 36} y2={BASE_Y}
            stroke="#F59E0B50" strokeWidth={0.8} strokeDasharray="3 2" />

          {/* ── hatching inside cylinder ── */}
          {Array.from({ length: Math.floor(cylH / 12) }).map((_, i) => (
            <line
              key={i}
              x1={cylX + 8} y1={cylY + 10 + i * 12}
              x2={cylX + cylW - 8} y2={cylY + 18 + i * 12}
              stroke="#6B728030" strokeWidth={0.7}
            />
          ))}
        </svg>

        {/* ── Fórmula ── */}
        <div className="bg-gray-800/60 rounded-lg px-6 py-4 text-center max-w-md w-full">
          <p className="text-gray-400 text-sm mb-2">Cilindrada unitaria</p>
          <p className="text-white font-mono text-lg">
            V = π &times; (D/2)&sup2; &times; S
          </p>
          <p className="text-gray-400 text-sm mt-2">
            V = π &times; ({(bore / 2).toFixed(1)})&sup2; &times; {stroke}
            {' = '}
            <span className="text-orange-400 font-bold text-base">
              {dispCC.toFixed(1)} cm&sup3;
            </span>
          </p>
        </div>

        {/* ratio indicator */}
        <p className="text-gray-500 text-sm">
          Ratio bore/stroke:{' '}
          <span className={`font-bold ${bore / stroke > 1 ? 'text-sky-400' : bore / stroke < 1 ? 'text-amber-400' : 'text-green-400'}`}>
            {(bore / stroke).toFixed(2)}
          </span>
          {' — '}
          {bore / stroke > 1.02
            ? 'Oversquare (superquadrado)'
            : bore / stroke < 0.98
              ? 'Undersquare (alargado)'
              : 'Square (cuadrado)'}
        </p>
      </div>
    </SectionWrapper>
  );
}
