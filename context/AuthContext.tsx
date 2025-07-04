import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';

type User = {
  id: number;
  username: string;
  email: string;
  roles: string[];
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isTokenValid: () => boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

function decodeJwt(token: string) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return {};
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const storedToken = await SecureStore.getItemAsync('token');
      const storedUser = await SecureStore.getItemAsync('user');
      if (storedToken && isTokenValid(storedToken)) {
        setToken(storedToken);
        setUser(storedUser ? JSON.parse(storedUser) : null);
      } else {
        setToken(null);
        setUser(null);
      }
      setLoading(false);
    })();
  }, []);

  const isTokenValid = (jwt: string | null = token) => {
    if (!jwt) return false;
    try {
      const payload = decodeJwt(jwt);
      if (!payload.exp) return true; // Brak exp - uznajemy za ważny
      const now = Date.now() / 1000;
      return payload.exp > now;
    } catch {
      return false;
    }
  };

  const login = async (username: string, password: string) => {
    setLoading(true);
    const res = await fetch('http://192.168.50.105:8080/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      setLoading(false);
      throw new Error('Nieprawidłowy login lub hasło');
    }
    const data = await res.json();
    setToken(data.accessToken);
    setUser({
      id: data.id,
      username: data.username,
      email: data.email,
      roles: data.roles,
    });
    await SecureStore.setItemAsync('token', data.accessToken);
    await SecureStore.setItemAsync('user', JSON.stringify({
      id: data.id,
      username: data.username,
      email: data.email,
      roles: data.roles,
    }));
    setLoading(false);
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isTokenValid }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}