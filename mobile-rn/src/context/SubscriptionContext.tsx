import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  canUseNativePurchases,
  fetchOfferings,
  initializeSubscription,
  isSubscriptionDevBypass,
  purchasePlan,
  restoreSubscription,
  type SubscriptionOffering,
  type SubscriptionPlan,
  type SubscriptionStatus,
} from '../services/subscription';

type SubscriptionContextValue = {
  status: SubscriptionStatus;
  offering: SubscriptionOffering;
  loading: boolean;
  purchasing: boolean;
  error: string;
  isSubscribed: boolean;
  nativePurchasesEnabled: boolean;
  devBypassEnabled: boolean;
  purchase: (plan: SubscriptionPlan) => Promise<boolean>;
  restore: () => Promise<boolean>;
  clearError: () => void;
};

const inactiveStatus: SubscriptionStatus = {
  isActive: false,
  plan: null,
  expirationDate: null,
  willRenew: false,
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SubscriptionStatus>(inactiveStatus);
  const [offering, setOffering] = useState<SubscriptionOffering>({ monthly: null, yearly: null });
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const nextStatus = await initializeSubscription();
      setStatus(nextStatus);

      if (canUseNativePurchases()) {
        const nextOffering = await fetchOfferings();
        setOffering(nextOffering);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load subscription status.');
      setStatus(inactiveStatus);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const purchase = useCallback(
    async (plan: SubscriptionPlan) => {
      setPurchasing(true);
      setError('');

      try {
        const nextStatus = await purchasePlan(offering, plan);
        setStatus(nextStatus);
        return nextStatus.isActive;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Purchase failed.';
        if (!message.toLowerCase().includes('cancel')) {
          setError(message);
        }
        return false;
      } finally {
        setPurchasing(false);
      }
    },
    [offering],
  );

  const restore = useCallback(async () => {
    setPurchasing(true);
    setError('');

    try {
      const nextStatus = await restoreSubscription();
      setStatus(nextStatus);

      if (!nextStatus.isActive) {
        setError('No active subscription was found for this Apple ID.');
      }

      return nextStatus.isActive;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restore failed.');
      return false;
    } finally {
      setPurchasing(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      status,
      offering,
      loading,
      purchasing,
      error,
      isSubscribed: status.isActive,
      nativePurchasesEnabled: canUseNativePurchases(),
      devBypassEnabled: isSubscriptionDevBypass(),
      purchase,
      restore,
      clearError: () => setError(''),
    }),
    [status, offering, loading, purchasing, error, purchase, restore],
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
}
