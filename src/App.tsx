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

export default function App() {
  const [activeSection, setActiveSection] = useState(sections[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );

    sections.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Sidebar activeSection={activeSection} />
      <main className="lg:ml-64">
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
      </main>
    </div>
  );
}
