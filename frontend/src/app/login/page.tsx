"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, Loader2 } from "lucide-react";
import { api } from "@/src/config";
import toast from "react-hot-toast";
import { AxiosError } from "axios";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevents page reload
    setLoading(true);

    try {
      const response = await api.post("/auth/login", formData);
      if (response.status === 200) {
        toast.success("Welcome back!");
        router.replace("/dashboard");
      }
    } catch (err: unknown) {
      console.error("Error:", err);
      const message =
        (err as AxiosError<{ message: string }>)?.response?.data?.message ||
        "Login failed. Please check your credentials.";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      {/* Subtle background glow for depth */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-zinc-200/50 dark:bg-zinc-800/20 blur-3xl" />
      </div>

      <div className="w-full max-w-md z-10">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Admin Login
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Enter your credentials to access the dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-600 transition-all"
                  placeholder="admin@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full pl-10 pr-12 py-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-600 transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 py-2.5 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-zinc-500 dark:text-zinc-500">
            &copy; {new Date().getFullYear()} Your Company. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
