import React from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import App from './App';
import { initVoiceKeyboardGuard } from './services/voice';

async function initNativePlugins() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    await StatusBar.setStyle({ style: prefersDark ? Style.Dark : Style.Light });
  } catch {
    // Status bar plugin unavailable
  }

  initVoiceKeyboardGuard();
}

initNativePlugins();

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
