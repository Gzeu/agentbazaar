// Re-export from WalletContext for backward compatibility
export { useWalletContext as useWallet } from '@/context/WalletContext';
export type { WalletContextType as WalletState, TxParams, TxResult } from '@/context/WalletContext';
