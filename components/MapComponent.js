"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet's default icon path issues in Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function BoundsFitter({ reports }) {
  const map = useMap();
  useEffect(() => {
    if (reports && reports.length > 0) {
      const bounds = L.latLngBounds(reports.map((r) => [r.lat, r.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [reports, map]);
  return null;
}

export default function MapComponent({ reports }) {
  // Center on India by default
  const defaultCenter = [20.5937, 78.9629];
  const defaultZoom = 5;

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: "100%", width: "100%", borderRadius: "4px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <BoundsFitter reports={reports} />

        {reports.map((report) => (
          <Marker key={report.id} position={[report.lat, report.lng]}>
            <Popup>
              <div style={{ maxWidth: "220px", fontFamily: "var(--font-sans, sans-serif)" }}>
                {report.photo_url && (
                  <img
                    src={report.photo_url}
                    alt="Issue"
                    style={{
                      width: "100%",
                      height: "120px",
                      objectFit: "cover",
                      borderRadius: "4px",
                      marginBottom: "8px",
                    }}
                  />
                )}
                <h3 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: 600, color: "var(--color-text-base)" }}>
                  {report.category}
                </h3>
                <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "var(--color-text-muted)" }}>
                  {report.description}
                </p>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      background: "var(--color-neutral-100)",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      color: "var(--color-text-base)",
                    }}
                  >
                    Urgency: {report.urgency}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      background: "var(--color-neutral-100)",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      color: "var(--color-text-base)",
                    }}
                  >
                    Status: {report.status}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Empty state overlay on top of the map */}
      {reports.length === 0 && (
        <div
          style={{
            position: "absolute",
            top: "1rem",
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--color-surface)",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            zIndex: 400,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            border: "1px solid var(--color-border)",
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--color-text-muted)",
          }}
        >
          No reports yet
        </div>
      )}
    </div>
  );
}
