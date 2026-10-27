import type { ReactNode } from 'react';

type FeatureLockProps = {
  children: ReactNode;
  locked?: boolean;
  title?: string;
  description?: string;
  actionLabel?: string;
  className?: string;
};

export function FeatureLock({ children }: FeatureLockProps) {
  // BrandRadar is 100% open source and free: all features and insights are unlocked
  return <>{children}</>;
}
