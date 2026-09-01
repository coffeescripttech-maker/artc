"use client";

// CS#23.3 §32 — frontend permission helper (UX only; the backend is always
// authoritative). Fetches the current user's effective permission keys once
// from /api/admin/access/my-permissions (30s server cache) and exposes a
// small `usePermissions()` hook for sidebar/button/page guards.

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest } from "@/lib/api";

let cachedKeys: Set<string> | null = null;
let inflight: Promise<Set<string>> | null = null;

function loadPermissions(): Promise<Set<string>> {
  if (cachedKeys) return Promise.resolve(cachedKeys);
  if (!inflight) {
    inflight = (apiRequest("/api/admin/access/my-permissions") as Promise<{
      permissions: string[];
    }>)
      .then((data) => {
        cachedKeys = new Set(data.permissions ?? []);
        return cachedKeys;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function usePermissions(): {
  permissions: Set<string>;
  /** True when the current user holds ANY of the given keys (super_admin always). */
  hasPermission: (keys: string | string[]) => boolean;
} {
  const { user } = useAuth();
  const [keys, setKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      cachedKeys = null;
      setKeys(new Set());
      return;
    }
    let cancelled = false;
    loadPermissions()
      .then((s) => {
        if (!cancelled) setKeys(s);
      })
      .catch(() => {
        if (!cancelled) setKeys(new Set());
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const hasPermission = useCallback(
    (k: string | string[]) => {
      if (!user) return false;
      if (user.roles.includes("super_admin")) return true;
      const arr = Array.isArray(k) ? k : [k];
      return arr.some((key) => keys.has(key));
    },
    [user, keys],
  );

  return { permissions: keys, hasPermission };
}