import AsyncStorage from '@react-native-async-storage/async-storage';

const cache = new Map<string, string>();
let initialized = false;

export async function initMemoryStorage(): Promise<void> {
  if (initialized) return;
  const pairs = await AsyncStorage.multiGet(await AsyncStorage.getAllKeys());
  for (const [key, value] of pairs) {
    if (key && value != null) {
      cache.set(key, value);
    }
  }
  initialized = true;
}

export function readStorage(key: string): string | null {
  return cache.get(key) ?? null;
}

export function writeStorage(key: string, value: string): void {
  cache.set(key, value);
  void AsyncStorage.setItem(key, value);
}

export function removeStorage(key: string): void {
  cache.delete(key);
  void AsyncStorage.removeItem(key);
}
