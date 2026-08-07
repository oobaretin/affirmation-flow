import { useCallback, useSyncExternalStore } from 'react';
import {
  consumeFreePreview,
  hasConsumedFreePreview,
  subscribeFreePreview,
} from '../services/freePreview';

export function useFreePreview() {
  const consumed = useSyncExternalStore(
    subscribeFreePreview,
    hasConsumedFreePreview,
    () => false,
  );

  const consume = useCallback(() => {
    if (!hasConsumedFreePreview()) {
      consumeFreePreview();
    }
  }, []);

  return { freePreviewConsumed: consumed, consumeFreePreview: consume };
}
