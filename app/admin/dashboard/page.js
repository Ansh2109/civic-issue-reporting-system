"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const STATUS_COLORS = {
  SUBMITTED:    { bg: "var(--color-status-submitted-bg)",    color: "var(--color-status-submitted-text)" },
  ACKNOWLEDGED: { bg: "var(--color-status-acknowledged-bg)", color: "var(--color-status-acknowledged-text)" },
  IN_PROGRESS:  { bg: "var(--color-status-inprogress-bg)",   color: "var(--color-status-inprogress-text)" },
  RESOLVED:     { bg: "var(--color-status-resolved-bg)",     color: "var(--color-status-resolved-text)" },
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/admin/login");
      } else {
        setIsAuthChecking(false);
        fetchReports();
      }
    }

    // Set up auth listener for future state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          router.push("/admin/login");
        }
      }
    );

    checkAuth();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  async function fetchReports() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });
      
    if (error) {
      console.error("Error fetching reports:", error);
    } else {
      setReports(data || []);
    }
    setIsLoading(false);
  }

  async function handleStatusChange(id, newStatus) {
    // Optimistic update
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));

    const { error } = await supabase
      .from("reports")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      console.error("Error updating status:", error);
      // Revert if error
      fetchReports();
      alert("Failed to update status: " + error.message);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  if (isAuthChecking) {
    return (
      <div className="page-container flex items-center justify-center">
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: "72rem" }}>
      {/* Page header */}
      <div className="section-header flex items-start justify-between">
        <div>
          <h1>Dashboard</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
            All citizen-submitted reports — filter, review, and update status.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: "var(--color-status-acknowledged-bg)",
              color: "var(--color-status-acknowledged-text)",
            }}
          >
            Admin view
          </span>
          <button 
            onClick={handleLogout}
            className="btn-secondary"
            style={{ padding: "0.25rem 0.75rem", fontSize: "0.75rem" }}
          >
            Log out
          </button>
        </div>
      </div>

      {/* Filter bar placeholder (Disabled for now as per MVP requirements, just keeping visual shell) */}
      <div
        className="card mb-4 flex flex-wrap gap-3 items-center"
        style={{ backgroundColor: "var(--color-neutral-50)", padding: "0.75rem 1rem" }}
      >
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
          Filters:
        </span>
        {["Category", "Status"].map((f) => (
          <select
            key={f}
            disabled
            aria-label={`Filter by ${f}`}
            className="form-input"
            style={{ width: "auto", minWidth: "8rem", fontSize: "0.8125rem", padding: "0.375rem 0.625rem", opacity: 0.6, cursor: "not-allowed" }}
          >
            <option>All {f}s</option>
          </select>
        ))}
      </div>

      {/* Reports table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--color-neutral-50)", borderBottom: "1px solid var(--color-border)" }}>
                {["ID", "Category", "Description", "Urgency", "Status", "Date", "Action"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "0.625rem 1rem",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--color-text-muted)",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                    Loading reports...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                    No reports found.
                  </td>
                </tr>
              ) : (
                reports.map((row) => (
                  <tr
                    key={row.id}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <td style={{ padding: "0.75rem 1rem", color: "var(--color-text-muted)", fontFamily: "monospace", fontSize: "0.8125rem" }}>
                      {row.id.split("-")[0]}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--color-neutral-600)" }}>{row.category}</td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--color-neutral-700)", maxWidth: "18rem" }}>
                      <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }} title={row.description}>
                        {row.description}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "center", color: "var(--color-neutral-600)" }}>{row.urgency}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor: STATUS_COLORS[row.status]?.bg,
                          color: STATUS_COLORS[row.status]?.color,
                        }}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--color-text-muted)", whiteSpace: "nowrap", fontSize: "0.8125rem" }}>
                      {new Date(row.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <select
                        aria-label="Update status"
                        className="form-input"
                        value={row.status}
                        onChange={(e) => handleStatusChange(row.id, e.target.value)}
                        style={{ width: "auto", fontSize: "0.8125rem", padding: "0.25rem 0.5rem" }}
                      >
                        <option value="SUBMITTED">SUBMITTED</option>
                        <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
