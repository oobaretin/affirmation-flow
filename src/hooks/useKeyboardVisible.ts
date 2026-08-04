import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import { useEffect, useState } from 'react';

export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;
    const listeners: Array<{ remove: () => Promise<void> | void }> = [];

    void Promise.all([
      Keyboard.addListener('keyboardWillShow', () => {
        if (cancelled) return;
        setVisible(true);
      }),
      Keyboard.addListener('keyboardWillHide', () => {
        if (cancelled) return;
        setVisible(false);
      }),
    ]).then((added) => {
      listeners.push(...added);
    });

    return () => {
      cancelled = true;
      listeners.forEach((listener) => {
        void listener.remove();
      });
    };
  }, []);

  return visible;
}
