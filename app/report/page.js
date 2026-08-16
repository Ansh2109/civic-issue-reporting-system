import ReportForm from "@/components/ReportForm";

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

      {/* Form — client component (uses GPS + state + Supabase) */}
      <div className="card">
        <ReportForm />
      </div>
    </div>
  );
}
