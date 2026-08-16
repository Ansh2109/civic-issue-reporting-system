"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const STATUS_COLORS = {
  SUBMITTED:    { bg: "var(--color-status-submitted-bg)",    color: "var(--color-status-submitted-text)" },
  ACKNOWLEDGED: { bg: "var(--color-status-acknowledged-bg)", color: "var(--color-status-acknowledged-text)" },
  IN_PROGRESS:  { bg: "var(--color-status-inprogress-bg)",   color: "var(--color-status-inprogress-text)" },
  RESOLVED:     { bg: "var(--color-status-resolved-bg)",     color: "var(--color-status-resolved-text)" },
};

export default function MyReportsPage() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNoIds, setHasNoIds] = useState(false);

  useEffect(() => {
    async function loadReports() {
      try {
        const savedIds = JSON.parse(localStorage.getItem("myReportIds") || "[]");
        
        if (savedIds.length === 0) {
          setHasNoIds(true);
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("reports")
          .select("*")
          .in("id", savedIds)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching my reports:", error);
        } else {
          setReports(data || []);
        }
      } catch (err) {
        console.error("Error reading from localStorage:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadReports();
  }, []);

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

      {isLoading ? (
        <div className="card text-center py-12">
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Loading your reports...</p>
        </div>
      ) : hasNoIds || reports.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-3xl mb-3">📭</p>
          <p className="font-semibold text-sm" style={{ color: "var(--color-neutral-700)" }}>
            You haven't submitted any reports yet
          </p>
          <div className="mt-4">
            <Link href="/report" className="btn-primary" style={{ display: "inline-flex", textDecoration: "none" }}>
              Submit a report
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {reports.map((report) => (
            <Link key={report.id} href={`/track/${report.id}`} style={{ textDecoration: "none" }}>
              <div className="card h-full transition-colors hover:border-gray-400" style={{ display: "flex", gap: "1rem", cursor: "pointer", borderColor: "var(--color-border)" }}>
                {(() => {
                  const url = report.photo_url;
                  let imgSrc = null;
                  
                  if (url && typeof url === "string") {
                    const trimmed = url.trim();
                    if (trimmed !== "" && !trimmed.startsWith("blob:")) {
                      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
                        imgSrc = trimmed;
                      } else {
                        imgSrc = supabase.storage.from("report-photos").getPublicUrl(trimmed).data.publicUrl;
                      }
                    }
                  }

                  return imgSrc ? (
                    <div style={{ flexShrink: 0, width: "80px", height: "80px", borderRadius: "4px", overflow: "hidden", backgroundColor: "var(--color-neutral-50)", border: "1px solid var(--color-border)" }}>
                      <img 
                        src={imgSrc} 
                        alt="Report thumbnail" 
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                      />
                    </div>
                  ) : (
                    <div style={{ flexShrink: 0, width: "80px", height: "80px", borderRadius: "4px", backgroundColor: "var(--color-neutral-50)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span className="text-xs text-gray-400">No Image</span>
                    </div>
                  );
                })()}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-sm font-semibold truncate pr-2" style={{ color: "var(--color-text-base)" }}>
                      {report.category}
                    </h3>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={{
                        backgroundColor: STATUS_COLORS[report.status]?.bg || "var(--color-neutral-100)",
                        color: STATUS_COLORS[report.status]?.color || "var(--color-text-base)",
                      }}
                    >
                      {report.status}
                    </span>
                  </div>
                  <p className="text-xs mb-2 flex-1" style={{ color: "var(--color-text-muted)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {report.description}
                  </p>
                  <p className="text-xs mt-auto" style={{ color: "var(--color-text-faint)" }}>
                    {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
