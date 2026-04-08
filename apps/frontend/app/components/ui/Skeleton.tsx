import { clsx } from 'clsx';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'rounded-xl bg-dark-surface animate-pulse border border-dark-border',
        className,
      )}
    />
  );
}
