"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getProfile } from "@/lib/api/auth";

export interface Media {
  id: string;
  media_name: string;
  path: string;
  type: string;
  tag_id?: string | null;
}

interface User {
  full_name: string;
  id: string;
  email: string;
  name?: string;
  roles: string[];
  permissions: string[];
  profileImage?: Media | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.roles?.includes("Super Admin")) return true;
    return user.permissions?.includes(permission) ?? false;
  };

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const data = await getProfile();
      setUser(data.data);
    } catch {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
