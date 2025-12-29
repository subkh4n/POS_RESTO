// Authentication Context - Global state management for user auth

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  User,
  AuthState,
  LoginCredentials,
  LoginResponse,
  UserRole,
} from "./types";
import { GOOGLE_SCRIPT_URL } from "../../constants";

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  logout: () => void;
  checkAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = "pos_user_session";
const SESSION_DURATION_HOURS = 3; // Session berlaku 3 jam

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    error: null,
  });

  // Check existing session on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    try {
      // Menggunakan sessionStorage agar session hilang saat browser ditutup
      const sessionData = sessionStorage.getItem(SESSION_KEY);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        // Check if session is expired
        if (new Date(session.expiresAt) > new Date()) {
          setState({
            isAuthenticated: true,
            user: session.user,
            isLoading: false,
            error: null,
          });
          return;
        } else {
          // Session expired, clear it
          sessionStorage.removeItem(SESSION_KEY);
        }
      }
      setState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
      });
    } catch {
      setState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
      });
    }
  };

  const login = async (
    credentials: LoginCredentials
  ): Promise<LoginResponse> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "login",
          username: credentials.username,
          password: credentials.password,
        }),
      });

      const data: LoginResponse = await response.json();

      if (data.success && data.user) {
        // Create session with 3 hour expiry
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + SESSION_DURATION_HOURS);

        const session = {
          user: data.user,
          expiresAt: expiresAt.toISOString(),
        };

        // Menggunakan sessionStorage agar session hilang saat browser ditutup
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));

        setState({
          isAuthenticated: true,
          user: data.user,
          isLoading: false,
          error: null,
        });
      } else {
        setState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: data.message || "Login gagal",
        });
      }

      return data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Terjadi kesalahan";
      setState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: errorMessage,
      });

      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
