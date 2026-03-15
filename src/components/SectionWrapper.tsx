import { ReactNode } from 'react';

interface Props {
  id: string;
  title: string;
  children: ReactNode;
}

export default function SectionWrapper({ id, title, children }: Props) {
  return (
    <section id={id} className="min-h-screen py-16 px-6 md:px-12 border-b border-gray-800/50">
      <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
      <div className="w-16 h-1 bg-orange-500 rounded mb-8" />
      {children}
    </section>
  );
}
