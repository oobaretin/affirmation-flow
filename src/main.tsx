import React from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import App from './App';
import { initVoiceKeyboardGuard, initPersistentVoiceAudio, initVoicePlaybackGuard } from './services/voice';

async function initNativePlugins() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    await StatusBar.setStyle({ style: prefersDark ? Style.Dark : Style.Light });
  } catch {
    // Status bar plugin unavailable
  }

  initVoiceKeyboardGuard();
  initPersistentVoiceAudio();
}

initNativePlugins();
initPersistentVoiceAudio();
initVoicePlaybackGuard();

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
