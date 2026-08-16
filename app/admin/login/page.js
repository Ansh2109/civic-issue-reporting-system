export const metadata = {
  title: "Admin Login — CivicReport",
  description: "Secure admin login for the CivicReport dashboard.",
};

export default function AdminLoginPage() {
  return (
    <div
      className="page-container-narrow"
      style={{ paddingTop: "5rem", paddingBottom: "5rem" }}
    >
      {/* Card */}
      <div className="card">
        {/* Header */}
        <div className="mb-6 pb-5" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-1"
            style={{ color: "var(--color-text-muted)" }}
          >
            Administration
          </p>
          <h1 style={{ fontSize: "1.375rem" }}>Sign in to Dashboard</h1>
        </div>

        {/* Form placeholder */}
        <div className="space-y-4">
          <div>
            <label className="form-label" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="admin@example.gov.in"
              disabled
              aria-disabled="true"
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
              disabled
              aria-disabled="true"
            />
          </div>

          <button
            type="button"
            className="btn-primary w-full justify-center mt-2"
            disabled
            aria-disabled="true"
            style={{ opacity: 0.6, cursor: "not-allowed" }}
          >
            Sign in
          </button>

          <p
            className="text-xs text-center"
            style={{ color: "var(--color-text-muted)" }}
          >
            Authentication coming soon — Supabase Auth will be wired in Phase 8.
          </p>
        </div>
      </div>
    </div>
  );
}
