import SectionWrapper from '../SectionWrapper';

/* ── Data ── */
interface EngineExample {
  name: string;
  bore: number;
  stroke: number;
  ratio: number;
  type: 'undersquare' | 'square' | 'oversquare' | 'supersquare';
  note?: string;
}

const EXAMPLES: EngineExample[] = [
  { name: 'BMW 730Ld B57 diésel', bore: 84, stroke: 90, ratio: 0.93, type: 'undersquare' },
  { name: 'BMW S58 (M2/M3/M4)', bore: 84, stroke: 90, ratio: 0.93, type: 'undersquare', note: 'biturbo' },
  { name: 'Ford Ranger Raptor EcoBlue 2.0', bore: 84, stroke: 90, ratio: 0.93, type: 'undersquare' },
  { name: 'Porsche 911 GT3 991.2', bore: 102, stroke: 81.5, ratio: 1.25, type: 'oversquare' },
  { name: 'Kawasaki ZXR750 1993', bore: 71, stroke: 47.3, ratio: 1.50, type: 'supersquare' },
  { name: 'Aprilia RSV4 RF 2016', bore: 78, stroke: 52.3, ratio: 1.49, type: 'supersquare' },
];

const TYPE_COLORS: Record<string, string> = {
  undersquare: '#F59E0B',
  square: '#34D399',
  oversquare: '#38BDF8',
  supersquare: '#A78BFA',
};

const TYPE_LABELS: Record<string, string> = {
  undersquare: 'Undersquare',
  square: 'Square',
  oversquare: 'Oversquare',
  supersquare: 'Supersquare',
};

/* ── Mini cylinder SVG ── */
function CylinderDiagram({
  bore, stroke, label, sublabel, color, maxRPM, character,
}: {
  bore: number; stroke: number; label: string; sublabel: string;
  color: string; maxRPM: string; character: string;
}) {
  const SCALE = 0.9;
  const w = bore * SCALE;
  const h = stroke * SCALE;
  const pad = 20;
  const vbW = Math.max(w + pad * 2, 120);
  const vbH = h + pad * 2 + 50;
  const cx = vbW / 2;
  const cylX = cx - w / 2;
  const cylY = pad;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox={`0 0 ${vbW} ${vbH}`} className="w-full" style={{ maxWidth: 150, minHeight: 140 }}>
        {/* cylinder */}
        <rect
          x={cylX} y={cylY}
          width={w} height={h}
          rx={3}
          fill={`${color}20`} stroke={color} strokeWidth={2}
        />
        {/* bore arrow */}
        <line x1={cylX + 4} y1={cylY + h + 12} x2={cylX + w - 4} y2={cylY + h + 12}
          stroke={color} strokeWidth={1.2} />
        <polygon points={`${cylX + 4},${cylY + h + 9} ${cylX + 4},${cylY + h + 15} ${cylX + 10},${cylY + h + 12}`} fill={color} />
        <polygon points={`${cylX + w - 4},${cylY + h + 9} ${cylX + w - 4},${cylY + h + 15} ${cylX + w - 10},${cylY + h + 12}`} fill={color} />

        {/* stroke arrow */}
        <line x1={cylX - 10} y1={cylY + 4} x2={cylX - 10} y2={cylY + h - 4}
          stroke={color} strokeWidth={1.2} />
        <polygon points={`${cylX - 13},${cylY + 4} ${cylX - 7},${cylY + 4} ${cylX - 10},${cylY + 10}`} fill={color} />
        <polygon points={`${cylX - 13},${cylY + h - 4} ${cylX - 7},${cylY + h - 4} ${cylX - 10},${cylY + h - 10}`} fill={color} />

        {/* ratio text inside */}
        <text x={cx} y={cylY + h / 2 + 4} textAnchor="middle" fill={color} fontSize={13} fontWeight={700}>
          {(bore / stroke).toFixed(2)}
        </text>

        {/* label below */}
        <text x={cx} y={cylY + h + 30} textAnchor="middle" fill="#E5E7EB" fontSize={11} fontWeight={600}>
          {label}
        </text>
        <text x={cx} y={cylY + h + 44} textAnchor="middle" fill="#9CA3AF" fontSize={9}>
          {sublabel}
        </text>
      </svg>
      <span className="text-xs text-gray-500">{maxRPM}</span>
      <span className="text-xs text-gray-400 text-center max-w-[140px]">{character}</span>
    </div>
  );
}

export default function S03Oversquare() {
  return (
    <SectionWrapper id="s03-oversquare" title="3 · Oversquare vs Undersquare">
      <p className="text-gray-400 max-w-2xl mb-6">
        La relación <strong className="text-white">bore/stroke</strong> define el carácter del motor.
        Un motor <em>oversquare</em> (diámetro &gt; carrera) respira mejor a alto régimen.
        Un motor <em>undersquare</em> (carrera &gt; diámetro) genera más par a bajo-medio régimen.
      </p>

      {/* ── Three cylinders comparison ── */}
      <div className="grid grid-cols-3 gap-6 max-w-xl mx-auto mb-10">
        <CylinderDiagram
          bore={70} stroke={90}
          label="Undersquare" sublabel="stroke > bore"
          color={TYPE_COLORS.undersquare}
          maxRPM="~5 000-6 500 rpm"
          character="Alto par, motor diésel o turbo gasolina"
        />
        <CylinderDiagram
          bore={80} stroke={80}
          label="Square" sublabel="stroke = bore"
          color={TYPE_COLORS.square}
          maxRPM="~7 000-8 000 rpm"
          character="Equilibrio par/potencia"
        />
        <CylinderDiagram
          bore={95} stroke={60}
          label="Oversquare" sublabel="bore > stroke"
          color={TYPE_COLORS.oversquare}
          maxRPM="~9 000-15 000+ rpm"
          character="Alto régimen, motos sport / atmosféricos"
        />
      </div>

      {/* ── Examples table ── */}
      <div className="overflow-x-auto">
        <table className="w-full max-w-3xl mx-auto text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400">
              <th className="text-left py-2 px-3 font-medium">Motor</th>
              <th className="text-center py-2 px-3 font-medium">Bore&times;Stroke</th>
              <th className="text-center py-2 px-3 font-medium">Ratio</th>
              <th className="text-center py-2 px-3 font-medium">Tipo</th>
              <th className="text-left py-2 px-3 font-medium">Nota</th>
            </tr>
          </thead>
          <tbody>
            {EXAMPLES.map((e) => (
              <tr key={e.name} className="border-b border-gray-800/60 hover:bg-gray-800/30 transition-colors">
                <td className="py-2 px-3 text-gray-200">{e.name}</td>
                <td className="py-2 px-3 text-center font-mono text-gray-300">
                  {e.bore}&times;{e.stroke} mm
                </td>
                <td className="py-2 px-3 text-center font-mono font-bold"
                  style={{ color: TYPE_COLORS[e.type] }}>
                  {e.ratio.toFixed(2)}
                </td>
                <td className="py-2 px-3 text-center">
                  <span
                    className="inline-block px-2 py-0.5 rounded text-xs font-semibold"
                    style={{
                      color: TYPE_COLORS[e.type],
                      backgroundColor: `${TYPE_COLORS[e.type]}18`,
                    }}
                  >
                    {TYPE_LABELS[e.type]}
                  </span>
                </td>
                <td className="py-2 px-3 text-gray-500 text-xs">{e.note ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── BMW S58 callout ── */}
      <div className="max-w-2xl mx-auto mt-8 bg-amber-500/10 border border-amber-500/30 rounded-lg px-5 py-4">
        <p className="text-amber-400 font-semibold text-sm mb-1">
          Caso especial: BMW S58 (84&times;90 mm, ratio 0.93)
        </p>
        <p className="text-gray-300 text-sm leading-relaxed">
          A pesar de ser <em>undersquare</em>, el S58 alcanza <strong>7 200 rpm</strong> gracias a sus
          dos turbocompresores twin-scroll. El turbo compensa la limitación de llenado a alto régimen
          que tendría un motor atmosférico con esta geometría tan alargada. Es un ejemplo perfecto de
          cómo la sobrealimentación permite desvincular la geometría bore/stroke del régimen máximo:
          la turbina fuerza el aire que el cilindro no podría aspirar por sí solo a esas vueltas.
        </p>
      </div>
    </SectionWrapper>
  );
}
