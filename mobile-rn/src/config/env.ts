export function getEnv(key: string): string {
  return process.env[key]?.trim() ?? '';
}

export function getElevenLabsApiKey(): string {
  return getEnv('EXPO_PUBLIC_ELEVENLABS_API_KEY');
}

export function getOpenAiApiKey(): string {
  return getEnv('EXPO_PUBLIC_OPENAI_API_KEY');
}

export function isSubscriptionDevBypass(): boolean {
  return getEnv('EXPO_PUBLIC_SUBSCRIPTION_DEV_BYPASS') === 'true';
}
