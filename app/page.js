import Link from "next/link";

export const metadata = {
  title: "CivicReport — Crowdsourced Civic Issue Reporting",
  description:
    "Snap a photo, share your location, and let the city know. Track resolution in real time on the live map.",
};

export default function HomePage() {
  return (
    <div className="page-container-narrow" style={{ paddingTop: "4rem", paddingBottom: "4rem", textAlign: "center" }}>

      {/* Badge */}
      <p
        className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-6"
        style={{
          backgroundColor: "var(--color-primary-50)",
          color: "var(--color-primary-700)",
          border: "1px solid var(--color-primary-200)",
        }}
      >
        Civic Tech MVP
      </p>

      <h1 className="mb-4">
        Report civic issues — get them fixed faster.
      </h1>

      <p className="mb-10" style={{ color: "var(--color-text-muted)", fontSize: "1rem" }}>
        Snap a photo, share your GPS location, and let the city know in
        under a minute. Track every report from submitted to resolved.
      </p>

      {/* CTA buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
        <Link
          href="/report"
          id="home-report-btn"
          className="btn-primary"
          style={{ fontSize: "0.9375rem", padding: "0.75rem 1.5rem" }}
        >
          📸 Report an Issue
        </Link>
        <Link
          href="/map"
          id="home-map-btn"
          className="btn-secondary"
          style={{ fontSize: "0.9375rem", padding: "0.75rem 1.5rem" }}
        >
          🗺️ View Live Map
        </Link>
      </div>

      {/* How it works — 3 steps */}
      <div
        className="card text-left"
        style={{ borderColor: "var(--color-neutral-100)", backgroundColor: "var(--color-neutral-50)" }}
      >
        <h2 className="mb-4 text-sm uppercase tracking-widest" style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>
          How it works
        </h2>
        <ol className="space-y-4">
          {[
            ["1.", "Snap & describe", "Take a photo and write a short description — AI fills the category automatically."],
            ["2.", "Location pinned", "Your GPS coordinates are captured so the exact spot is marked on the map."],
            ["3.", "Track progress", "Follow the report through Submitted → In Progress → Resolved."],
          ].map(([num, title, body]) => (
            <li key={num} className="flex gap-4">
              <span
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor: "var(--color-primary-100)",
                  color: "var(--color-primary-700)",
                }}
              >
                {num}
              </span>
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--color-neutral-800)" }}>{title}</p>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <p className="mt-8 text-sm" style={{ color: "var(--color-neutral-400)" }}>
        City staff?{" "}
        <Link href="/admin/login" style={{ color: "var(--color-primary-600)" }}>
          Admin login →
        </Link>
      </p>
    </div>
  );
}
