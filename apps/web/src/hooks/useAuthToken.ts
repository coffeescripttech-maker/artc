"use client";

import { useState, useEffect } from "react";

/**
 * Hook to get the auth token from localStorage
 * Returns the token string or empty string if not available
 */
export function useAuthToken() {
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    // Get token from localStorage
    const storedToken = localStorage.getItem("token");
    setToken(storedToken || "");
  }, []);

  return token;
}

/**
 * Get token synchronously (for use in non-react contexts)
 */
export function getAuthToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || "";
}
