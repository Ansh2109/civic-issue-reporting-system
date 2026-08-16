export const metadata = {
  title: "My Reports — CivicReport",
  description: "View all your submitted civic issue reports and their statuses.",
};

/* Status badge preview — shows what the real badges will look like */
const STATUS_EXAMPLES = [
  { label: "Submitted",    bg: "var(--color-status-submitted-bg)",    color: "var(--color-status-submitted-text)" },
  { label: "Acknowledged", bg: "var(--color-status-acknowledged-bg)", color: "var(--color-status-acknowledged-text)" },
  { label: "In Progress",  bg: "var(--color-status-inprogress-bg)",   color: "var(--color-status-inprogress-text)" },
  { label: "Resolved",     bg: "var(--color-status-resolved-bg)",     color: "var(--color-status-resolved-text)" },
];

export default function MyReportsPage() {
  return (
    <div className="page-container">
      {/* Page header */}
      <div className="section-header flex items-start justify-between">
        <div>
          <h1>My Reports</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
            All issues you have submitted, with live status updates.
          </p>
        </div>
      </div>

      {/* Empty state card */}
      <div className="card text-center py-12">
        <p className="text-3xl mb-3">📭</p>
        <p className="font-semibold text-sm" style={{ color: "var(--color-neutral-700)" }}>
          No reports yet
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
          Your submitted reports will appear here once you sign in.
        </p>
      </div>

      {/* Status legend */}
      <div className="mt-6 card" style={{ backgroundColor: "var(--color-neutral-50)" }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-muted)" }}>
          Status guide
        </p>
        <div className="flex flex-wrap gap-2">
          {STATUS_EXAMPLES.map(({ label, bg, color }) => (
            <span
              key={label}
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: bg, color }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
