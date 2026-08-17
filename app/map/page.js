"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";

// Dynamically import the map component to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[var(--color-neutral-50)]">
      <p className="text-sm text-[var(--color-text-muted)]">Loading map...</p>
    </div>
  ),
});

export default function MapPage() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchReports() {
      try {
        const { data, error: err } = await supabase
          .from("reports")
          .select("*")
          .neq("status", "RESOLVED")
          .order("created_at", { ascending: false });

        if (err) throw err;
        setReports(data || []);
      } catch (err) {
        console.error("Error fetching reports:", err);
        setError("Failed to load reports.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchReports();
  }, []);

  return (
    <div className="page-container-narrow" style={{ maxWidth: "1000px" }}>
      {/* Page header */}
      <div className="section-header">
        <h1>Live Map</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
          All active reports are pinned on the map in real time.
        </p>
      </div>

      {/* Map card */}
      <div
        className="card"
        style={{
          height: "500px",
          display: "flex",
          flexDirection: "column",
          padding: 0, // Remove padding so map fills the card
          overflow: "hidden",
        }}
      >
        {isLoading ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--color-neutral-50)" }}>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Loading map...</p>
          </div>
        ) : error ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--color-neutral-50)" }}>
            <p className="text-sm" style={{ color: "#dc2626" }}>{error}</p>
          </div>
        ) : (
          <div style={{ flex: 1, position: "relative", zIndex: 0 }}>
            <MapComponent reports={reports} />
          </div>
        )}
      </div>
    </div>
  );
}
