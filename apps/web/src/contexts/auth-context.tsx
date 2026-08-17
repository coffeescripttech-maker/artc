"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

interface LearnerProfile {
  id: string;
  userId: string;
  currentStage: string;
  currentGradeLevel: string;
}

interface AuthState {
  user: User | null;
  learnerProfile: LearnerProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    learnerProfile: null,
    isLoading: true,
    isAuthenticated: false,
  });
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const data = await apiRequest("/api/auth/me") as {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        roles: string[];
        learnerProfile?: LearnerProfile;
      };
      setState({
        user: {
          id: data.id,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          roles: data.roles,
        },
        learnerProfile: data.learnerProfile || null,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch {
      localStorage.removeItem("token");
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const login = async (email: string, password: string) => {
    const data = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }) as {
      user: User;
      learnerProfile?: LearnerProfile;
      token: string;
    };

    localStorage.setItem("token", data.token);
    setState({
      user: data.user,
      learnerProfile: data.learnerProfile || null,
      isLoading: false,
      isAuthenticated: true,
    });
  };

  const register = async (
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ) => {
    const data = await apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ firstName, lastName, email, password }),
    }) as {
      user: User;
      learnerProfile?: LearnerProfile;
      token: string;
    };

    localStorage.setItem("token", data.token);
    setState({
      user: data.user,
      learnerProfile: data.learnerProfile || null,
      isLoading: false,
      isAuthenticated: true,
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    setState({
      user: null,
      learnerProfile: null,
      isLoading: false,
      isAuthenticated: false,
    });
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
