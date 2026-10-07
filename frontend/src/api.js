export const API_URL =
  import.meta.env.VITE_API_URL || "http://13.200.102.40:4000";

export class UnauthorizedError extends Error {}

export function decodeToken(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

export async function request(path, token, { method = "GET", body } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) throw new UnauthorizedError("Session expired");
  if (!response.ok) throw new Error(`Request failed (${response.status})`);

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
