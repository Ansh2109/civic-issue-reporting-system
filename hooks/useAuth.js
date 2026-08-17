"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { usePathname, useRouter } from "next/navigation";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function handleSession(sessionUser) {
      if (!sessionUser) {
        if (mounted) {
          setUser(null);
          setIsProfileComplete(false);
          setLoading(false);
        }
        return;
      }

      if (isProfileComplete) {
        if (mounted) {
          setUser(sessionUser);
          setLoading(false);
        }
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone_number, role")
        .eq("id", sessionUser.id)
        .maybeSingle();

      // Admins and workers bypass the citizen profile completion requirement
      const isStaff = data?.role === "admin" || data?.role === "worker";
      const complete = isStaff || !!(data && data.full_name && data.phone_number);

      if (mounted) {
        setIsProfileComplete(complete);
        setUser(sessionUser);
        setLoading(false);
      }

      if (!complete && pathname && !pathname.startsWith("/admin") && pathname !== "/complete-profile") {
        router.push(`/complete-profile?returnTo=${encodeURIComponent(pathname)}`);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        handleSession(session?.user || null);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [pathname, router, isProfileComplete]);

  return { user, loading };
}
