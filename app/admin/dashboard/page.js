export const metadata = {
  title: "Admin Dashboard — CivicReport",
  description: "Manage all civic issue reports — update statuses and filter by category.",
};

const STATUS_COLORS = {
  SUBMITTED:    { bg: "var(--color-status-submitted-bg)",    color: "var(--color-status-submitted-text)" },
  ACKNOWLEDGED: { bg: "var(--color-status-acknowledged-bg)", color: "var(--color-status-acknowledged-text)" },
  IN_PROGRESS:  { bg: "var(--color-status-inprogress-bg)",   color: "var(--color-status-inprogress-text)" },
  RESOLVED:     { bg: "var(--color-status-resolved-bg)",     color: "var(--color-status-resolved-text)" },
};

/* Placeholder rows so the table shell looks realistic */
const PLACEHOLDER_ROWS = [
  { id: "—", category: "—", description: "Reports will appear here after Supabase is connected.", urgency: "—", status: "SUBMITTED", date: "—" },
];

export default function AdminDashboardPage() {
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
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{
            backgroundColor: "var(--color-status-acknowledged-bg)",
            color: "var(--color-status-acknowledged-text)",
          }}
        >
          Admin view
        </span>
      </div>

      {/* Filter bar placeholder */}
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
              {PLACEHOLDER_ROWS.map((row, i) => (
                <tr
                  key={i}
                  style={{ borderBottom: "1px solid var(--color-border)" }}
                >
                  <td style={{ padding: "0.75rem 1rem", color: "var(--color-text-muted)", fontFamily: "monospace", fontSize: "0.8125rem" }}>{row.id}</td>
                  <td style={{ padding: "0.75rem 1rem", color: "var(--color-neutral-600)" }}>{row.category}</td>
                  <td style={{ padding: "0.75rem 1rem", color: "var(--color-neutral-700)", maxWidth: "18rem" }}>
                    <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
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
                  <td style={{ padding: "0.75rem 1rem", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>{row.date}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <select
                      disabled
                      aria-label="Update status"
                      className="form-input"
                      style={{ width: "auto", fontSize: "0.8125rem", padding: "0.25rem 0.5rem", opacity: 0.5, cursor: "not-allowed" }}
                    >
                      <option>Update status</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
        Auth guard and live data will be wired in Phase 8.
      </p>
    </div>
  );
}
