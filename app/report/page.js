export const metadata = {
  title: "Report an Issue — CivicReport",
  description: "Submit a civic issue report with photo and your GPS location.",
};

export default function ReportPage() {
  return (
    <div className="page-container-narrow">
      {/* Page header */}
      <div className="section-header">
        <h1>Report an Issue</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
          Fields marked <span style={{ color: "#dc2626" }}>*</span> are required.
        </p>
      </div>

      {/* Placeholder form card */}
      <div className="card">
        <p
          className="text-sm text-center py-8"
          style={{ color: "var(--color-text-muted)" }}
        >
          <span className="block text-2xl mb-3">📋</span>
          Form coming soon — photo upload, GPS capture, and AI-powered
          category classification will appear here.
        </p>
      </div>
    </div>
  );
}
