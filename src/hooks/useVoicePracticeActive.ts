import { useSyncExternalStore } from 'react';
import {
  isTodayVoicePracticeActive,
  subscribeTodayVoicePractice,
} from '../services/todayViewSession';

export function useVoicePracticeActive(): boolean {
  return useSyncExternalStore(
    subscribeTodayVoicePractice,
    isTodayVoicePracticeActive,
    () => false,
  );
}
