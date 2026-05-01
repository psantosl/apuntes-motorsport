import { useState } from 'react';

const sections = [
  { id: 's01-cilindro', label: '1. El cilindro' },
  { id: 's02-bore-stroke', label: '2. Bore, stroke y cilindrada' },
  { id: 's03-oversquare', label: '3. Oversquare vs undersquare' },
  { id: 'ciclos', label: '4. Ciclos: 2T y 4T' },
  { id: 'fuerzas', label: '5. Fuerzas primarias y secundarias' },
  { id: 'ciguenal', label: '6. El cigüeñal' },
  { id: 's07-balance-i4', label: '7. Balance del I4' },
  { id: 's08-balance-i6', label: '8. Balance del I6' },
  { id: 's09-patrones', label: '9. Patrones de disparo' },
  { id: 's10-big-bang', label: '10. Big Bang vs Screamer' },
  { id: 's11-configuraciones', label: '11. Configuraciones' },
  { id: 's12-giroscopico', label: '12. Efecto giroscópico' },
];

interface SidebarProps {
  activeSection: string;
}

export default function Sidebar({ activeSection }: SidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(!open)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-gray-800 p-2 rounded-lg border border-gray-700"
        aria-label="Toggle menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {open ? (
            <path d="M6 6l12 12M6 18L18 6" />
          ) : (
            <path d="M3 6h18M3 12h18M3 18h18" />
          )}
        </svg>
      </button>

      {/* Overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <nav
        className={`fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-800 z-40
        overflow-y-auto transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        <div className="p-4 pt-6">
          <h1 className="text-lg font-bold text-white mb-1">Cómo funcionan</h1>
          <h1 className="text-lg font-bold text-orange-400 mb-6">los motores</h1>
          <ul className="space-y-0.5">
            {sections.map(s => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onClick={() => setOpen(false)}
                  className={`block px-3 py-2 rounded text-sm transition-colors ${
                    activeSection === s.id
                      ? 'bg-orange-500/15 text-orange-400 font-medium'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`}
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-6 pt-4 border-t border-gray-800">
            <p className="px-3 mb-2 text-xs uppercase tracking-wide text-gray-500">Herramientas</p>
            <a
              href={`${import.meta.env.BASE_URL}visualizador-motor.html`}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-2 rounded text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
            >
              Visualizador 3D de motor ↗
            </a>
          </div>
        </div>
      </nav>
    </>
  );
}

export { sections };
