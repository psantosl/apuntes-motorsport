import { useState } from 'react';
import SectionWrapper from '../SectionWrapper';
import { PISTON_COLORS } from '../../utils/engine';

/* ── Types ── */
type CrankConfig = 'transversal' | 'longitudinal' | 'counter';

interface ConfigInfo {
  key: CrankConfig;
  label: string;
  shortLabel: string;
  color: string;
  description: string;
  example: string;
}

const CONFIGS: ConfigInfo[] = [
  {
    key: 'transversal',
    label: 'Motor transversal',
    shortLabel: 'Transversal',
    color: PISTON_COLORS[1],
    description:
      'El cigüeñal es perpendicular a la dirección de marcha. Al inclinar la moto para girar, se rota el eje del cigüeñal. El efecto giroscópico se opone a la inclinación: a más RPM, más resistencia al cambio de dirección.',
    example: 'I4 japoneses (Yamaha R1, Honda CBR) — a 14.000 rpm son notoriamente lentos al entrar en curva.',
  },
  {
    key: 'longitudinal',
    label: 'Motor longitudinal',
    shortLabel: 'Longitudinal',
    color: PISTON_COLORS[3],
    description:
      'El cigüeñal es paralelo a la dirección de marcha. Al inclinar, no se rota el eje sino que se gira alrededor de él. El efecto giroscópico genera un par de guiñada (yaw) en lugar de resistir la inclinación.',
    example: 'BMW boxer, Moto Guzzi V-twin longitudinal — comportamiento en curva muy diferente.',
  },
  {
    key: 'counter',
    label: 'Cigüeñal contra-rotativo',
    shortLabel: 'Contra-rotativo',
    color: PISTON_COLORS[6],
    description:
      'El cigüeñal gira en sentido contrario a las ruedas. El efecto giroscópico se invierte: en lugar de resistir la inclinación, la favorece. La moto entra en curva con más facilidad.',
    example: 'Ducati Desmosedici GP — Casey Stoner era conocido por explotar esta característica para su agresivo estilo de pilotaje.',
  },
];

/* ── SVG constants ── */
const VB_W = 500;
const VB_H = 380;

/* ── Isometric motorcycle silhouette ── */
function MotorcycleSilhouette({
  cx,
  cy,
  leanDeg,
  config,
  rpm,
}: {
  cx: number;
  cy: number;
  leanDeg: number;
  config: CrankConfig;
  rpm: number;
}) {
  // Gyroscopic torque magnitude (normalized 0..1)
  const torqueMag = (rpm / 16000) * (Math.abs(leanDeg) / 40);
  const clampedTorque = Math.min(torqueMag, 1);

  // Torque arrow properties depend on config
  let arrowAngle = 0;     // direction of gyroscopic torque arrow
  let arrowLabel = '';
  let arrowColor = '';
  const cfgInfo = CONFIGS.find(c => c.key === config)!;

  if (config === 'transversal') {
    // Resists lean — arrow pointing opposite to lean direction
    arrowAngle = leanDeg > 0 ? -90 : 90; // pushes bike upright
    arrowLabel = 'Resiste inclinación';
    arrowColor = '#EF4444';
  } else if (config === 'longitudinal') {
    // Generates yaw — arrow pointing forward/backward (horizontal)
    arrowAngle = leanDeg > 0 ? 0 : 180;
    arrowLabel = 'Par de guiñada';
    arrowColor = '#F59E0B';
  } else {
    // Counter-rotating — helps lean
    arrowAngle = leanDeg > 0 ? 90 : -90; // pushes bike into lean
    arrowLabel = 'Favorece inclinación';
    arrowColor = '#22C55E';
  }

  const arrowLen = 20 + clampedTorque * 60;
  const arrowEndX = cx + Math.cos((arrowAngle * Math.PI) / 180) * arrowLen;
  const arrowEndY = cy - 60 + Math.sin((arrowAngle * Math.PI) / 180) * arrowLen * 0.5;

  return (
    <g>
      {/* Motorcycle body group — leaned */}
      <g transform={`rotate(${leanDeg}, ${cx}, ${cy + 40})`}>
        {/* Wheels */}
        <ellipse cx={cx - 55} cy={cy + 40} rx={22} ry={28} fill="none" stroke="#6B7280" strokeWidth={2.5} />
        <ellipse cx={cx + 55} cy={cy + 40} rx={22} ry={28} fill="none" stroke="#6B7280" strokeWidth={2.5} />

        {/* Frame / body */}
        <path
          d={`M${cx - 40},${cy + 20} L${cx - 20},${cy - 30} L${cx + 15},${cy - 40} L${cx + 40},${cy - 10} L${cx + 45},${cy + 20} Z`}
          fill="#1F2937" stroke={cfgInfo.color} strokeWidth={1.5}
        />

        {/* Engine block */}
        <rect
          x={cx - 18} y={cy - 5}
          width={36} height={28}
          rx={3}
          fill="#374151" stroke={cfgInfo.color} strokeWidth={1}
        />

        {/* Crankshaft indicator */}
        {config === 'transversal' && (
          <g>
            {/* Perpendicular to travel — horizontal line */}
            <line x1={cx - 14} y1={cy + 9} x2={cx + 14} y2={cy + 9}
              stroke={cfgInfo.color} strokeWidth={2.5} strokeLinecap="round" />
            <circle cx={cx - 14} cy={cy + 9} r={3} fill={cfgInfo.color} />
            <circle cx={cx + 14} cy={cy + 9} r={3} fill={cfgInfo.color} />
          </g>
        )}
        {config === 'longitudinal' && (
          <g>
            {/* Parallel to travel — vertical line in this view */}
            <line x1={cx} y1={cy} x2={cx} y2={cy + 20}
              stroke={cfgInfo.color} strokeWidth={2.5} strokeLinecap="round" />
            <circle cx={cx} cy={cy} r={3} fill={cfgInfo.color} />
            <circle cx={cx} cy={cy + 20} r={3} fill={cfgInfo.color} />
          </g>
        )}
        {config === 'counter' && (
          <g>
            {/* Same as transversal but with rotation arrow */}
            <line x1={cx - 14} y1={cy + 9} x2={cx + 14} y2={cy + 9}
              stroke={cfgInfo.color} strokeWidth={2.5} strokeLinecap="round" />
            <circle cx={cx - 14} cy={cy + 9} r={3} fill={cfgInfo.color} />
            <circle cx={cx + 14} cy={cy + 9} r={3} fill={cfgInfo.color} />
            {/* Counter-rotation arrow */}
            <path
              d={`M${cx + 8},${cy + 2} A 7 7 0 1 0 ${cx - 8},${cy + 2}`}
              fill="none" stroke="#22C55E" strokeWidth={1.2}
              markerEnd="url(#arrowGreen)"
            />
          </g>
        )}

        {/* Handlebar */}
        <line x1={cx + 12} y1={cy - 40} x2={cx + 20} y2={cy - 55}
          stroke="#9CA3AF" strokeWidth={2} strokeLinecap="round" />

        {/* Seat */}
        <path
          d={`M${cx - 30},${cy - 28} Q${cx - 10},${cy - 38} ${cx + 5},${cy - 38}`}
          fill="none" stroke="#9CA3AF" strokeWidth={2.5} strokeLinecap="round"
        />
      </g>

      {/* Direction of travel arrow */}
      <line x1={cx + 90} y1={cy + 40} x2={cx + 130} y2={cy + 40}
        stroke="#4B5563" strokeWidth={1.5} markerEnd="url(#arrowGray)" />
      <text x={cx + 110} y={cy + 55} fill="#4B5563" fontSize={9} textAnchor="middle">
        marcha
      </text>

      {/* Gyroscopic torque arrow — only show when there's lean and rpm */}
      {Math.abs(leanDeg) > 2 && rpm > 1000 && (
        <g>
          <line
            x1={cx} y1={cy - 60}
            x2={arrowEndX} y2={arrowEndY}
            stroke={arrowColor} strokeWidth={2 + clampedTorque * 2}
            strokeLinecap="round"
            markerEnd="url(#arrowTorque)"
            opacity={0.5 + clampedTorque * 0.5}
          />
          <text
            x={arrowEndX + (arrowAngle === 0 ? 10 : arrowAngle === 180 ? -10 : 0)}
            y={arrowEndY - 10}
            fill={arrowColor}
            fontSize={10}
            fontWeight={600}
            textAnchor="middle"
            opacity={0.6 + clampedTorque * 0.4}
          >
            {arrowLabel}
          </text>
        </g>
      )}

      {/* Lean angle label */}
      <text x={cx} y={cy + 90} fill="#6B7280" fontSize={10} textAnchor="middle">
        Inclinación: {leanDeg > 0 ? '+' : ''}{leanDeg}°
      </text>
    </g>
  );
}

export default function S12Giroscopico() {
  const [config, setConfig] = useState<CrankConfig>('transversal');
  const [rpm, setRpm] = useState(8000);
  const [leanDeg, setLeanDeg] = useState(25);

  const activeConfig = CONFIGS.find(c => c.key === config)!;

  // RPM-dependent gyroscopic torque bar width
  const torqueBar = (rpm / 16000) * 100;

  return (
    <SectionWrapper id="s12-giroscopico" title="12 · Efecto giroscópico">
      <p className="text-gray-400 max-w-2xl mb-6">
        El cigüeñal girando a alta velocidad actúa como un <strong className="text-white">giroscopio</strong>.
        Su orientación respecto a la dirección de marcha determina cómo afecta al comportamiento de la moto
        al inclinarse para tomar una curva.
      </p>

      {/* ── Config toggle ── */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CONFIGS.map(c => (
          <button
            key={c.key}
            onClick={() => setConfig(c.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              config === c.key
                ? 'text-white ring-1'
                : 'bg-gray-800/50 text-gray-500 hover:text-gray-300'
            }`}
            style={config === c.key ? {
              backgroundColor: `${c.color}20`,
              color: c.color,
              boxShadow: `inset 0 0 0 1px ${c.color}60`,
            } : undefined}
          >
            {c.shortLabel}
          </button>
        ))}
      </div>

      {/* ── Main SVG visualization ── */}
      <div className="flex flex-col items-center gap-4 mb-6">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="w-full max-w-xl"
          style={{ minHeight: 340 }}
        >
          <defs>
            <marker id="arrowGray" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <path d="M0,0 L8,3 L0,6 Z" fill="#4B5563" />
            </marker>
            <marker id="arrowTorque" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
              <path d="M0,0 L10,4 L0,8 Z" fill={
                config === 'transversal' ? '#EF4444' :
                config === 'longitudinal' ? '#F59E0B' : '#22C55E'
              } />
            </marker>
            <marker id="arrowGreen" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
              <path d="M0,0 L6,2.5 L0,5 Z" fill="#22C55E" />
            </marker>
          </defs>

          {/* Title */}
          <text x={VB_W / 2} y={24} fill={activeConfig.color} fontSize={15} fontWeight={700} textAnchor="middle">
            {activeConfig.label}
          </text>

          <MotorcycleSilhouette
            cx={VB_W / 2}
            cy={180}
            leanDeg={leanDeg}
            config={config}
            rpm={rpm}
          />

          {/* RPM indicator bar */}
          <text x={30} y={320} fill="#6B7280" fontSize={10}>RPM</text>
          <rect x={60} y={312} width={200} height={10} rx={5} fill="#1F2937" stroke="#374151" strokeWidth={1} />
          <rect x={60} y={312} width={torqueBar * 2} height={10} rx={5} fill={activeConfig.color} opacity={0.6} />
          <text x={268} y={322} fill="#9CA3AF" fontSize={10}>{rpm.toLocaleString()}</text>

          {/* Torque magnitude indicator */}
          <text x={30} y={350} fill="#6B7280" fontSize={10}>Par giroscópico</text>
          {(() => {
            const mag = (rpm / 16000) * (Math.abs(leanDeg) / 40);
            const barW = Math.min(mag, 1) * 200;
            const barColor = config === 'transversal' ? '#EF4444' :
              config === 'longitudinal' ? '#F59E0B' : '#22C55E';
            return (
              <>
                <rect x={60} y={342} width={200} height={10} rx={5} fill="#1F2937" stroke="#374151" strokeWidth={1} />
                <rect x={60} y={342} width={barW} height={10} rx={5} fill={barColor} opacity={0.6} />
              </>
            );
          })()}
        </svg>
      </div>

      {/* ── RPM and lean sliders ── */}
      <div className="flex flex-wrap gap-8 mb-6 max-w-lg">
        <label className="flex flex-col gap-1 flex-1 min-w-[180px]">
          <span className="text-gray-400 text-sm">
            RPM: <span className="text-white font-mono">{rpm.toLocaleString()}</span>
          </span>
          <input
            type="range" min={1000} max={16000} step={500} value={rpm}
            onChange={e => setRpm(Number(e.target.value))}
            className="accent-orange-500"
          />
        </label>
        <label className="flex flex-col gap-1 flex-1 min-w-[180px]">
          <span className="text-gray-400 text-sm">
            Inclinación: <span className="text-white font-mono">{leanDeg}°</span>
          </span>
          <input
            type="range" min={-45} max={45} step={1} value={leanDeg}
            onChange={e => setLeanDeg(Number(e.target.value))}
            className="accent-orange-500"
          />
        </label>
      </div>

      {/* ── Description panel ── */}
      <div className="max-w-2xl mb-8">
        <div
          className="rounded-lg p-5 space-y-3 text-sm leading-relaxed"
          style={{ backgroundColor: `${activeConfig.color}08`, border: `1px solid ${activeConfig.color}30` }}
        >
          <p className="text-gray-300">{activeConfig.description}</p>
          <p className="text-gray-500 text-xs">
            <span className="font-semibold text-gray-400">Ejemplo:</span> {activeConfig.example}
          </p>
        </div>
      </div>

      {/* ── Summary comparison ── */}
      <div className="max-w-2xl">
        <h3 className="text-lg text-gray-300 font-semibold mb-4">Comparativa</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CONFIGS.map(c => (
            <div
              key={c.key}
              className={`rounded-lg p-4 cursor-pointer transition-all ${
                config === c.key ? 'ring-1' : 'opacity-60 hover:opacity-80'
              }`}
              style={{
                backgroundColor: `${c.color}10`,
                boxShadow: config === c.key ? `inset 0 0 0 1px ${c.color}50` : undefined,
              }}
              onClick={() => setConfig(c.key)}
            >
              <h4 className="font-semibold text-sm mb-2" style={{ color: c.color }}>{c.label}</h4>
              <p className="text-gray-400 text-xs leading-relaxed">
                {c.key === 'transversal' && 'Resiste la inclinación. Moto estable en recta pero lenta al entrar en curva a altas RPM.'}
                {c.key === 'longitudinal' && 'Genera guiñada al inclinar. Comportamiento distinto pero no resiste el lean directamente.'}
                {c.key === 'counter' && 'Favorece la inclinación. La moto cae con más facilidad hacia la curva.'}
              </p>
              <p className="text-gray-600 text-xs mt-2">{c.example.split(' — ')[0]}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
