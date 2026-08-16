export const metadata = {
  title: "Live Map — CivicReport",
  description: "See all reported civic issues on the live map.",
};

export default function MapPage() {
  return (
    <div className="page-container">
      {/* Page header */}
      <div className="section-header">
        <h1>Live Map</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
          All active reports are pinned on the map in real time.
        </p>
      </div>

      {/* Map placeholder */}
      <div
        className="card flex items-center justify-center"
        style={{
          height: "420px",
          backgroundColor: "var(--color-neutral-50)",
          borderStyle: "dashed",
        }}
      >
        <div className="text-center">
          <p className="text-3xl mb-3">🗺️</p>
          <p className="font-semibold text-sm" style={{ color: "var(--color-neutral-600)" }}>
            Leaflet map coming soon
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
            OpenStreetMap tiles · No API key required
          </p>
        </div>
      </div>
    </div>
  );
}
