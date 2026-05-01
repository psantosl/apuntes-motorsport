import { useState, useEffect, lazy, Suspense } from 'react';
import Sidebar, { sections } from './components/Sidebar';

const S01Cilindro = lazy(() => import('./components/sections/S01Cilindro'));
const S02BoreStroke = lazy(() => import('./components/sections/S02BoreStroke'));
const S03Oversquare = lazy(() => import('./components/sections/S03Oversquare'));
const S04Ciclos = lazy(() => import('./components/sections/S04Ciclos'));
const S05Fuerzas = lazy(() => import('./components/sections/S05Fuerzas'));
const S06Ciguenal = lazy(() => import('./components/sections/S06Ciguenal'));
const S07BalanceI4 = lazy(() => import('./components/sections/S07BalanceI4'));
const S08BalanceI6 = lazy(() => import('./components/sections/S08BalanceI6'));
const S09Patrones = lazy(() => import('./components/sections/S09Patrones'));
const S10BigBang = lazy(() => import('./components/sections/S10BigBang'));
const S11Configuraciones = lazy(() => import('./components/sections/S11Configuraciones'));
const S12Giroscopico = lazy(() => import('./components/sections/S12Giroscopico'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const VISUALIZER_HASH = '#visualizador';

export default function App() {
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const [hash, setHash] = useState(() =>
    typeof window !== 'undefined' ? window.location.hash : ''
  );
  const showVisualizer = hash === VISUALIZER_HASH;

  useEffect(() => {
    function onHashChange() {
      setHash(window.location.hash);
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // When switching back from visualizer to sections, scroll to the requested section
  useEffect(() => {
    if (showVisualizer || !hash || hash === '#') return;
    const id = hash.slice(1);
    if (!sections.some(s => s.id === id)) return;
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ block: 'start' });
    });
  }, [showVisualizer, hash]);

  useEffect(() => {
    if (showVisualizer) return;

    // Track which sections are currently intersecting
    const visibleSet = new Set<string>();

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visibleSet.add(entry.target.id);
          } else {
            visibleSet.delete(entry.target.id);
          }
        }
        // Pick the first visible section in document order
        for (const s of sections) {
          if (visibleSet.has(s.id)) {
            setActiveSection(s.id);
            break;
          }
        }
      },
      { rootMargin: '-10% 0px -60% 0px' }
    );

    // MutationObserver to handle lazy-loaded sections appearing in the DOM
    const observed = new Set<string>();

    function observeSections() {
      for (const s of sections) {
        if (observed.has(s.id)) continue;
        const el = document.getElementById(s.id);
        if (el) {
          observer.observe(el);
          observed.add(s.id);
        }
      }
    }

    observeSections();

    const mutation = new MutationObserver(() => {
      if (observed.size < sections.length) observeSections();
    });
    mutation.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutation.disconnect();
    };
  }, [showVisualizer]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Sidebar activeSection={activeSection} showVisualizer={showVisualizer} />
      <main className="lg:ml-64">
        {showVisualizer ? (
          <iframe
            src={`${import.meta.env.BASE_URL}visualizador-motor.html`}
            className="block w-full border-0"
            style={{ height: '100vh' }}
            title="Visualizador 3D de motor"
          />
        ) : (
          <Suspense fallback={<LoadingFallback />}>
            <S01Cilindro />
            <S02BoreStroke />
            <S03Oversquare />
            <S04Ciclos />
            <S05Fuerzas />
            <S06Ciguenal />
            <S07BalanceI4 />
            <S08BalanceI6 />
            <S09Patrones />
            <S10BigBang />
            <S11Configuraciones />
            <S12Giroscopico />
          </Suspense>
        )}
      </main>
    </div>
  );
}
