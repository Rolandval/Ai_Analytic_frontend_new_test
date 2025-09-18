export interface AuthResponse {
  token?: string;
  access_token?: string;
  user?: any;
  [key: string]: any;
}

export interface Credentials {
  email: string;
  password: string;
}

const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';

async function postJsonWithFallback(
  paths: string[],
  payload: any
): Promise<Response> {
  let lastErr: any = null;
  for (const p of paths) {
    try {
      const res = await fetch(`${API_BASE}${p}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (res.ok) return res;
      // If 404 or 405, try next path
      if (res.status === 404 || res.status === 405) {
        lastErr = await res.text();
        continue;
      }
      // For other errors, throw immediately
      const txt = await res.text();
      throw new Error(txt || `Request failed: ${res.status}`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(typeof lastErr === 'string' ? lastErr : (lastErr?.message || 'All auth endpoints failed'));
}

// Note: per requirements, do NOT send form or multipart fallbacks. JSON only.

export async function register(payload: Credentials): Promise<AuthResponse> {
  const paths = ['/users/register', '/users/register/'];
  const res = await postJsonWithFallback(paths, payload);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    // some backends may return empty body but set cookie
    return {} as AuthResponse;
  }
}

export async function login(payload: Credentials): Promise<AuthResponse> {
  const paths = ['/users/login', '/users/login/', '/login', '/login/', '/auth/login', '/auth/login/'];
  const res = await postJsonWithFallback(paths, payload);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return {} as AuthResponse;
  }
}

// Request password reset/new password via email
export async function requestPassword(payload: { email: string }): Promise<void> {
  const paths = ['/users/get_password', '/users/get_password/'];
  await postJsonWithFallback(paths, payload);
}

// Logout current user (server-side session/cookie invalidation)
export async function logout(): Promise<void> {
  const paths = ['/users/logout', '/users/logout/'];
  try {
    await postJsonWithFallback(paths, {});
  } catch (_) {
    // Even if API not available, proceed to clear client state
  }
}
