"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const STATUS_FLOW = ["SUBMITTED", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED"];

const STATUS_COLORS = {
  SUBMITTED:    { bg: "var(--color-status-submitted-bg)",    color: "var(--color-status-submitted-text)" },
  ACKNOWLEDGED: { bg: "var(--color-status-acknowledged-bg)", color: "var(--color-status-acknowledged-text)" },
  IN_PROGRESS:  { bg: "var(--color-status-inprogress-bg)",   color: "var(--color-status-inprogress-text)" },
  RESOLVED:     { bg: "var(--color-status-resolved-bg)",     color: "var(--color-status-resolved-text)" },
};

export default function TrackReportPage({ params }) {
  // Support for both Next 14 (params.id) and Next 15 (params as Promise)
  const [id, setId] = useState(null);
  
  useEffect(() => {
    async function unwrapParams() {
      if (params instanceof Promise) {
        const resolved = await params;
        setId(resolved.id);
      } else {
        setId(params.id);
      }
    }
    unwrapParams();
  }, [params]);

  const [report, setReport] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    async function fetchReport() {
      setIsLoading(true);
      const { data: reportData, error: err } = await supabase
        .from("reports")
        .select("*")
        .eq("id", id)
        .single();

      if (err) {
        console.error("Error fetching report:", err);
        setError("Report not found");
      } else {
        setReport(reportData);
        
        // Fetch updates
        const { data: updateData, error: updateErr } = await supabase
          .from("report_updates")
          .select("*")
          .eq("report_id", id)
          .order("changed_at", { ascending: true });
          
        if (!updateErr && updateData) {
          setUpdates(updateData);
        }
      }
      setIsLoading(false);
    }
    fetchReport();
  }, [id]);

  if (isLoading || !id) {
    return (
      <div className="page-container flex items-center justify-center">
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Loading report details...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="page-container text-center py-12">
        <h1 className="text-2xl mb-4">Report Not Found</h1>
        <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
          We couldn't find a report with that ID.
        </p>
        <Link href="/my-reports" className="btn-secondary" style={{ textDecoration: "none" }}>
          Back to My Reports
        </Link>
      </div>
    );
  }

  const timeline = [
    { status: "SUBMITTED", timestamp: report.created_at }
  ];
  updates.forEach(u => {
    timeline.push({ status: u.new_status, timestamp: u.changed_at });
  });

  return (
    <div className="page-container-narrow">
      <div className="mb-4">
        <Link href="/my-reports" className="text-xs font-semibold hover:underline" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>
          ← Back to My Reports
        </Link>
      </div>
      
      <div className="card mb-6">
        <div className="mb-4">
          <h1 className="text-xl font-semibold mb-1">{report.category} Issue</h1>
          <p className="text-xs font-mono" style={{ color: "var(--color-text-faint)" }}>
            Ticket: {report.ticket_number}
          </p>
        </div>
        
        {/* Real Status Timeline */}
        <div className="mb-10 mt-8">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4 text-center" style={{ color: "var(--color-text-muted)" }}>
            Status History
          </p>
          <div className="flex flex-col gap-4 px-4 sm:px-12">
            {timeline.map((event, index) => {
              const isLast = index === timeline.length - 1;
              return (
                <div key={index} className="flex items-start gap-4 relative">
                  {!isLast && (
                    <div 
                      className="absolute left-3 top-6 bottom-[-1rem] w-0.5" 
                      style={{ backgroundColor: "var(--color-neutral-200)", transform: "translateX(-50%)" }}
                    />
                  )}
                  <div 
                    className="w-6 h-6 rounded-full border-2 flex-shrink-0 z-10 mt-0.5"
                    style={{ 
                      backgroundColor: STATUS_COLORS[event.status]?.bg || "var(--color-neutral-100)",
                      borderColor: STATUS_COLORS[event.status]?.color || "var(--color-border)"
                    }}
                  />
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wider" style={{ color: STATUS_COLORS[event.status]?.color || "var(--color-text-base)" }}>
                      {event.status === "SUBMITTED" ? "Report Submitted" : event.status.replace("_", " ")}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-8 pt-6" style={{ borderTop: "1px solid var(--color-border)" }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>Details</p>
            <p className="text-sm mb-6" style={{ color: "var(--color-text-base)", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
              {report.description}
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--color-text-muted)" }}>Urgency</p>
                <p className="text-sm font-medium">{report.urgency} / 5</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--color-text-muted)" }}>Submitted</p>
                <p className="text-sm font-medium">{new Date(report.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--color-text-muted)" }}>Location</p>
              <p className="text-sm font-mono tracking-tight">{report.lat.toFixed(5)}, {report.lng.toFixed(5)}</p>
            </div>
          </div>

          <div>
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

              if (!imgSrc) return null;

              return (
                <>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>Attached Photo</p>
                  <div style={{ borderRadius: "4px", overflow: "hidden", backgroundColor: "var(--color-neutral-50)", border: "1px solid var(--color-border)" }}>
                    <img 
                      src={imgSrc} 
                      alt="Report Photo" 
                      style={{ width: "100%", height: "auto", display: "block" }} 
                    />
                  </div>
                </>
              );
            })()}
            {(() => {
              const resUrl = report.resolution_photo_url;
              if (report.status === "RESOLVED" && resUrl && typeof resUrl === "string" && resUrl.trim() !== "") {
                const trimmed = resUrl.trim();
                const resImgSrc = (trimmed.startsWith("http://") || trimmed.startsWith("https://")) 
                  ? trimmed 
                  : supabase.storage.from("report-photos").getPublicUrl(trimmed).data.publicUrl;

                return (
                  <div className="mt-6 pt-6" style={{ borderTop: "1px solid var(--color-border)" }}>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-status-resolved-text)" }}>Resolution Photo</p>
                    <div style={{ borderRadius: "4px", overflow: "hidden", backgroundColor: "var(--color-neutral-50)", border: "1px solid var(--color-border)" }}>
                      <img 
                        src={resImgSrc} 
                        alt="Resolution Photo" 
                        style={{ width: "100%", height: "auto", display: "block" }} 
                      />
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
