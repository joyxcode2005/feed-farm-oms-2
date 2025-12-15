"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Admin, api } from "@/src/config";

export function useAdminAuth() {
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const res = await api.get("/auth/info");
      setAdmin(res.data.admin);
    } catch {
      toast.error("Please log in to continue", {
        duration: 2000,
      });
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
      toast.success("Logged out successfully", {
        duration: 1500,
      });
      router.push("/login");
    } catch {
      toast.error("Logout failed");
    }
  };

  useEffect(() => {
    checkAuth();
  });

  return { admin, loading, logout };
}
