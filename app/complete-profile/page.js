"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function CompleteProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/";
  const { user, loading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/");
      return;
    }

    async function checkProfile() {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, phone_number")
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;

        // If the profile already has both fields, no need to be here
        if (data && data.full_name && data.phone_number) {
          router.replace(returnTo);
        } else {
          // Pre-fill if they partially filled it
          if (data?.full_name) setFullName(data.full_name);
          if (data?.phone_number) setPhoneNumber(data.phone_number);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error checking profile:", err);
        setError("Failed to load profile data.");
        setIsLoading(false);
      }
    }

    checkProfile();
  }, [user, authLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    const trimmedName = fullName.trim();
    const trimmedPhone = phoneNumber.trim();

    if (!trimmedName) {
      setError("Full Name is required.");
      return;
    }

    // Basic 10-digit validation (ignores spaces, dashes, parentheses)
    const digitOnlyPhone = trimmedPhone.replace(/\D/g, "");
    if (digitOnlyPhone.length < 10) {
      setError("Please enter a valid phone number (at least 10 digits).");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upsert ensures the row is created if the trigger hasn't fired yet
      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: trimmedName,
          phone_number: trimmedPhone,
          updated_at: new Date().toISOString(),
        });

      if (upsertError) throw upsertError;

      router.push(returnTo);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err.message || "Failed to save profile. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="page-container-narrow flex items-center justify-center min-h-[50vh]">
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="page-container-narrow" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
      <div className="card">
        <div className="mb-6 pb-5" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-1"
            style={{ color: "var(--color-text-muted)" }}
          >
            One Last Step
          </p>
          <h1 style={{ fontSize: "1.375rem" }}>Complete Your Profile</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
            We need a bit more contact info so city staff can follow up on your reports if necessary.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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
            <label className="form-label" htmlFor="fullName">
              Full Name <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              id="fullName"
              type="text"
              className="form-input"
              placeholder="e.g. Jane Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="form-label" htmlFor="phoneNumber">
              Phone Number <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              id="phoneNumber"
              type="tel"
              className="form-input"
              placeholder="e.g. 555-123-4567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isSubmitting}
            />
            <p className="text-xs mt-1" style={{ color: "var(--color-text-faint)" }}>
              We'll only use this to contact you about your submitted issues.
            </p>
          </div>

          <button
            type="submit"
            className="btn-primary w-full justify-center mt-4"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save and Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
