'use client';

import { PropsWithChildren } from 'react';
import { WalletProvider } from '@/context/WalletContext';

export function Providers({ children }: PropsWithChildren) {
  return (
    <WalletProvider>
      {children}
    </WalletProvider>
  );
}
