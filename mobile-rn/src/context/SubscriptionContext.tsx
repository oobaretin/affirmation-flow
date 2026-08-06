import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { isSubscriptionDevBypass } from '../config/env';

interface SubscriptionContextValue {
  loading: boolean;
  isSubscribed: boolean;
  devBypassEnabled: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextValue>({
  loading: false,
  isSubscribed: false,
  devBypassEnabled: false,
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const devBypassEnabled = isSubscriptionDevBypass();

  const value = useMemo(
    () => ({
      loading: false,
      isSubscribed: devBypassEnabled,
      devBypassEnabled,
    }),
    [devBypassEnabled],
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
