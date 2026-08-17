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
  const [totalCitizens, setTotalCitizens] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const [showAddWorker, setShowAddWorker] = useState(false);
  const [workerForm, setWorkerForm] = useState({ full_name: "", email: "", phone_number: "", department: "general" });
  const [isCreatingWorker, setIsCreatingWorker] = useState(false);

  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);

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

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const statsRes = await fetch("/api/admin/stats", {
          headers: { "Authorization": `Bearer ${session.access_token}` }
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setTotalCitizens(statsData.totalCitizens || 0);
        }
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
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

  async function handleCreateWorker(e) {
    e.preventDefault();
    setIsCreatingWorker(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/create-worker", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify(workerForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create worker");
      
      alert(`Worker created successfully!\n\nEmail: ${data.email}\nTemporary Password: ${data.tempPassword}\n\nPlease copy this now!`);
      setWorkerForm({ full_name: "", email: "", phone_number: "", department: "general" });
      setShowAddWorker(false);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setIsCreatingWorker(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setIsResetting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ email: resetEmail })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");

      alert(`Password reset successfully!\n\nEmail: ${data.email}\nNEW Temporary Password: ${data.tempPassword}\n\nPlease copy this immediately.`);
      setResetEmail("");
      setShowResetPassword(false);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setIsResetting(false);
    }
  }

  const filteredReports = reports.filter(r => {
    const matchCategory = selectedCategory === "ALL" || r.category === selectedCategory;
    const matchStatus = selectedStatus === "ALL" || r.status === selectedStatus;
    return matchCategory && matchStatus;
  });

  if (isAuthChecking) {
    return (
      <div className="page-container flex items-center justify-center">
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Checking authentication...</p>
      </div>
    );
  }

  const totalReports = reports.length;
  const totalSolved = reports.filter(r => r.status === "RESOLVED").length;
  const totalPending = totalReports - totalSolved;
  const criticalReports = reports.filter(r => r.urgency >= 4 && r.status !== "RESOLVED").length;
  const overdueReports = reports.filter(r => {
    if (r.status === "RESOLVED") return false;
    const reportDate = new Date(r.created_at);
    const hoursDiff = (new Date() - reportDate) / (1000 * 60 * 60);
    return hoursDiff > 24;
  }).length;

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

      {/* Quick Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        <div className="card flex flex-col justify-center" style={{ padding: "1.25rem", borderLeft: "4px solid var(--color-status-submitted-ring)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Total Reports</p>
          <p className="text-3xl font-bold mt-2" style={{ color: "var(--color-text-base)" }}>{totalReports}</p>
        </div>
        <div className="card flex flex-col justify-center" style={{ padding: "1.25rem", borderLeft: "4px solid var(--color-status-resolved-ring)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Total Solved</p>
          <p className="text-3xl font-bold mt-2" style={{ color: "var(--color-status-resolved-text)" }}>{totalSolved}</p>
        </div>
        <div className="card flex flex-col justify-center" style={{ padding: "1.25rem", borderLeft: "4px solid #f59e0b" }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Total Pending</p>
          <p className="text-3xl font-bold mt-2" style={{ color: "#f59e0b" }}>{totalPending}</p>
        </div>
        <div className="card flex flex-col justify-center" style={{ padding: "1.25rem", borderLeft: "4px solid #3b82f6" }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Total Citizens</p>
          <p className="text-3xl font-bold mt-2" style={{ color: "#3b82f6" }}>{totalCitizens}</p>
        </div>
        <div className="card flex flex-col justify-center" style={{ padding: "1.25rem", borderLeft: "4px solid #ef4444" }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Critical (Urgency 4-5)</p>
          <p className="text-3xl font-bold mt-2" style={{ color: "#ef4444" }}>{criticalReports}</p>
        </div>
        <div className="card flex flex-col justify-center" style={{ padding: "1.25rem", borderLeft: "4px solid #f97316" }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>SLA Alert (&gt; 24h Unresolved)</p>
          <p className="text-3xl font-bold mt-2" style={{ color: "#f97316" }}>{overdueReports}</p>
        </div>
      </div>

      {/* Add Worker Section */}
      <div className="card mb-4" style={{ backgroundColor: "var(--color-neutral-50)", padding: "1rem" }}>
        <button 
          onClick={() => setShowAddWorker(!showAddWorker)}
          type="button"
          style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", color: "var(--color-text-base)", cursor: "pointer" }}
        >
          <span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>
            {showAddWorker ? "▼ Add New Worker" : "▶ Add New Worker"}
          </span>
        </button>
        
        {showAddWorker && (
          <form onSubmit={handleCreateWorker} style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              <div>
                <label className="form-label">Full Name</label>
                <input required className="form-input" value={workerForm.full_name} onChange={e => setWorkerForm({...workerForm, full_name: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input required type="email" className="form-input" value={workerForm.email} onChange={e => setWorkerForm({...workerForm, email: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Phone Number</label>
                <input required className="form-input" value={workerForm.phone_number} onChange={e => setWorkerForm({...workerForm, phone_number: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Department</label>
                <select className="form-input" value={workerForm.department} onChange={e => setWorkerForm({...workerForm, department: e.target.value})}>
                  <option value="sanitation">Sanitation</option>
                  <option value="public_works">Public Works</option>
                  <option value="electrical">Electrical</option>
                  <option value="water">Water</option>
                  <option value="general">General</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" className="btn-primary" disabled={isCreatingWorker}>
                {isCreatingWorker ? "Creating..." : "Create Worker"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Reset Password Section */}
      <div className="card mb-4" style={{ backgroundColor: "var(--color-neutral-50)", padding: "1rem" }}>
        <button 
          onClick={() => setShowResetPassword(!showResetPassword)}
          type="button"
          style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", color: "var(--color-text-base)", cursor: "pointer" }}
        >
          <span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>
            {showResetPassword ? "▼ Reset Employee Password" : "▶ Reset Employee Password"}
          </span>
        </button>
        
        {showResetPassword && (
          <form onSubmit={handleResetPassword} style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label className="form-label">Employee Email Address</label>
              <input required type="email" className="form-input max-w-md" placeholder="e.g. worker@city.gov" value={resetEmail} onChange={e => setResetEmail(e.target.value)} />
              <p className="text-xs mt-1 text-red-600">Warning: This will instantly overwrite their current password.</p>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <button type="submit" className="btn-secondary" disabled={isResetting} style={{ color: "#dc2626", borderColor: "#fca5a5" }}>
                {isResetting ? "Resetting..." : "Force Reset Password"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Filter bar */}
      <div
        className="card mb-4 flex flex-wrap gap-3 items-center"
        style={{ backgroundColor: "var(--color-neutral-50)", padding: "0.75rem 1rem" }}
      >
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
          Filters:
        </span>
        
        <select
          aria-label="Filter by Category"
          className="form-input"
          style={{ width: "auto", minWidth: "8rem", fontSize: "0.8125rem", padding: "0.375rem 0.625rem" }}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="ALL">All Categories</option>
          {[...new Set(reports.map(r => r.category))].filter(Boolean).map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          aria-label="Filter by Status"
          className="form-input"
          style={{ width: "auto", minWidth: "8rem", fontSize: "0.8125rem", padding: "0.375rem 0.625rem" }}
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="SUBMITTED">SUBMITTED</option>
          <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="RESOLVED">RESOLVED</option>
        </select>
      </div>

      {/* Reports table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--color-neutral-50)", borderBottom: "1px solid var(--color-border)" }}>
                {["Ticket", "Category", "Description", "Urgency", "Status", "Date", "Action"].map((h) => (
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
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                    No reports found matching filters.
                  </td>
                </tr>
              ) : (
                filteredReports.map((row) => (
                  <tr
                    key={row.id}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <td style={{ padding: "0.75rem 1rem", color: "var(--color-text-muted)", fontFamily: "monospace", fontSize: "0.8125rem" }}>
                      {row.ticket_number}
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
