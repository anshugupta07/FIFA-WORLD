const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function handleResponse(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export async function fetchZones() {
  const res = await fetch(`${BASE_URL}/api/zones`);
  return handleResponse(res);
}

export async function sendChatMessage({ sessionId, message, language }) {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, message, language }),
  });
  return handleResponse(res);
}

export async function fetchGreeting(language) {
  const res = await fetch(`${BASE_URL}/api/chat/greeting/${language}`);
  return handleResponse(res);
}

export const SOCKET_URL = BASE_URL;
