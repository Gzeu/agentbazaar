import { ReactNode } from 'react';
import { Navbar } from './Navbar';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0f1117]">
      <Navbar />
      <main className="pt-14">{children}</main>
    </div>
  );
}
