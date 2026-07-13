const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function getToken(): string | null {
  return localStorage.getItem('brew_token');
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem('brew_token', token);
  } else {
    localStorage.removeItem('brew_token');
  }
}

export function getUser(): any | null {
  const user = localStorage.getItem('brew_user');
  return user ? JSON.parse(user) : null;
}

export function setUser(user: any | null) {
  if (user) {
    localStorage.setItem('brew_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('brew_user');
  }
}

export async function request(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const method = options.method || 'GET';
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMsg = 'Terjadi kesalahan pada server';
      let errJson: any = null;
      try {
        errJson = await response.json();
        errorMsg = errJson.message || errorMsg;
      } catch (_) {}
      
      console.error(`[API Error] ${method} ${endpoint} - Status ${response.status}: ${errorMsg}`, errJson);
      throw new Error(errorMsg);
    }

    return response.json();
  } catch (error: any) {
    if (!(error instanceof Error)) {
      console.error(`[Network Error] ${method} ${endpoint} failed`, error);
    } else if (!error.message.includes('Terjadi kesalahan') && !error.message.includes('status:')) {
      console.error(`[API Request Exception] ${method} ${endpoint} failed: ${error.message}`);
    }
    throw error;
  }
}
