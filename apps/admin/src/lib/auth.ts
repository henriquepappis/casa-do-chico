export interface AuthUser {
  id: string;
  username: string;
  role: string;
}

export function getToken(): string | null {
  return localStorage.getItem("admin_token");
}

export function getUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem("admin_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAuth(token: string, user: AuthUser) {
  localStorage.setItem("admin_token", token);
  localStorage.setItem("admin_user", JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_user");
}
