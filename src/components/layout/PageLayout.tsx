import type { ReactNode } from 'react';
import Header from './Header';

interface Props {
  children: ReactNode;
}

export default function PageLayout({ children }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </div>
  );
}
