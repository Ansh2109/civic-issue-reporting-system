"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }
      
      const user = data?.user;
      if (!user) {
        throw new Error("Failed to authenticate user: no user returned.");
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw new Error(`Error fetching profile role: ${profileError.message}`);
      }

      if (!profile) {
        throw new Error("No profile found for this user. Please ensure the user has a row in the profiles table.");
      }

      if (profile.role === "worker") {
        router.push("/worker/dashboard");
      } else if (profile.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        throw new Error(`Access denied: invalid role for this portal (${profile.role || "none"})`);
      }
    } catch (err) {
      console.error("Login flow error:", err);
      setError(err.message || "An unexpected error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className="page-container-narrow"
      style={{ paddingTop: "5rem", paddingBottom: "5rem" }}
    >
      <div className="card">
        <div className="mb-6 pb-5" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-1"
            style={{ color: "var(--color-text-muted)" }}
          >
            Staff Portal
          </p>
          <h1 style={{ fontSize: "1.375rem" }}>Admin & Employee Login</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div
              style={{
                padding: "0.75rem",
                borderRadius: "6px",
                backgroundColor: "var(--color-status-submitted-bg)",
                border: "1px solid var(--color-status-submitted-ring)",
                color: "var(--color-status-submitted-text)",
                fontSize: "0.875rem",
              }}
            >
              {error}
            </div>
          )}
          
          <div>
            <label className="form-label" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="admin@example.gov.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-full justify-center mt-2"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
