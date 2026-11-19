import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.message || `Falha na API (${response.status}).`);
    error.status = response.status;
    if (response.status === 401 && token) await clearSessionToken();
    throw error;
  }
  return payload;
}

let webToken;

export async function getSessionToken() {
  if (Platform.OS === 'web') return webToken || null;
  const SecureStore = await import('expo-secure-store');
  return SecureStore.getItemAsync('herbora-token');
}

export async function saveSessionToken(token) {
  if (Platform.OS === 'web') {
    webToken = token;
    return;
  }
  const SecureStore = await import('expo-secure-store');
  await SecureStore.setItemAsync('herbora-token', token);
}

export async function clearSessionToken() {
  if (Platform.OS === 'web') {
    webToken = null;
    return;
  }
  const SecureStore = await import('expo-secure-store');
  await SecureStore.deleteItemAsync('herbora-token');
}
