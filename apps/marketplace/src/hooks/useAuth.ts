"use client";

import { useState, useEffect, useCallback } from "react";
import { servicesApi } from "@/lib/api";

export interface Session {
  address: string;
  token: string;
}

export const sessionKey = "ab:session";

export function useAuth() {
  const read = () => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(sessionKey);
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      return null;
    }
  };
  const [session, setSession] = useState<Session | null>(read);

  useEffect(() => {
    const onStorage = () => setSession(read());
    window.addEventListener("storage-update", onStorage);
    return () => window.removeEventListener("storage-update", onStorage);
  }, []);

  const login = useCallback(
    async (address: string, providerMode = false) => {
      const res = await servicesApi.authLogin(address, !!providerMode);
      const token = res.access_token;
      const sess: Session = { address, token };
      window.localStorage.setItem(sessionKey, JSON.stringify(sess));
      window.localStorage.setItem("ab:token", token);
      window.dispatchEvent(new Event("storage-update"));
      setSession(sess);
      return sess;
    },
    [],
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(sessionKey);
    window.localStorage.removeItem("ab:token");
    window.dispatchEvent(new Event("storage-update"));
    setSession(null);
  }, []);

  return {
    session,
    address: session?.address ?? null,
    token: session?.token ?? null,
    login,
    logout,
  };
}

export function useProviderSession() {
  const { session } = useAuth();
  return { providerAddress: session?.address ?? null, isProvider: !!session };
}
