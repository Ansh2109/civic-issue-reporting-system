"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const DEPARTMENT_CATEGORIES = {
  sanitation: ["garbage"],
  public_works: ["pothole", "roads", "drainage", "illegal_construction"],
  electrical: ["streetlight", "traffic_signal"],
  water: ["water_leak"],
  general: ["other"]
};

export default function WorkerDashboardPage() {
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [workerProfile, setWorkerProfile] = useState(null);
  
  const [resolvingId, setResolvingId] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cameraState, setCameraState] = useState("idle");
  const [photoError, setPhotoError] = useState("");
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return router.push("/admin/login");
      }
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
        
      if (!profile || profile.role !== "worker") {
        return router.push("/");
      }
      
      setWorkerProfile(profile);
      fetchReports(profile.department);
    }
    
    init();
    
    return () => {
      stopCamera();
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [router]);

  useEffect(() => {
    if (cameraState === "active" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraState]);

  async function fetchReports(department) {
    setIsLoading(true);
    let query = supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });
      
    const allowedCategories = DEPARTMENT_CATEGORIES[department] || [];
    if (allowedCategories.length > 0) {
      query = query.in("category", allowedCategories);
    }
    
    const { data, error } = await query;
    if (error) console.error(error);
    setReports(data || []);
    setIsLoading(false);
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }

  async function startCamera() {
    setCameraState("requesting");
    setPhotoError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      streamRef.current = stream;
      setCameraState("active");
    } catch (err) {
      console.error(err);
      setCameraState("denied");
      setPhotoError("Camera access required.");
    }
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (!blob) {
        setPhotoError("Failed to capture photo.");
        return;
      }
      const file = new File([blob], `resolve-${Date.now()}.jpg`, { type: "image/jpeg" });
      setPhoto(file);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(URL.createObjectURL(file));
      stopCamera();
      setCameraState("idle");
    }, "image/jpeg", 0.85);
  }

  function retakePhoto() {
    if (preview) URL.revokeObjectURL(preview);
    setPhoto(null);
    setPreview(null);
    setPhotoError("");
    startCamera();
  }

  async function submitResolution() {
    if (!photo || !resolvingId) return;
    setIsSubmitting(true);
    
    try {
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("report-photos")
        .upload(fileName, photo, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("report-photos")
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("reports")
        .update({ 
          status: "RESOLVED",
          resolution_photo_url: publicUrl 
        })
        .eq("id", resolvingId);
        
      if (updateError) throw updateError;
      
      setResolvingId(null);
      setPhoto(null);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      alert("Issue marked as resolved!");
      fetchReports(workerProfile.department);
      
    } catch (err) {
      console.error(err);
      alert("Failed to submit resolution: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  if (isLoading || !workerProfile) {
    return <div className="page-container flex justify-center"><p className="text-neutral-500">Loading dashboard...</p></div>;
  }

  const totalAssigned = reports.length;
  const totalSolved = reports.filter(r => r.status === "RESOLVED").length;
  const pendingReports = reports.filter(r => r.status !== "RESOLVED");
  const totalLeft = pendingReports.length;

  return (
    <div className="page-container" style={{ maxWidth: "72rem" }}>
      <div className="section-header flex items-start justify-between">
        <div>
          <h1>Worker Dashboard</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
            Assigned tasks for the {workerProfile.department.replace("_", " ")} department.
          </p>
        </div>
        <button onClick={handleLogout} className="btn-secondary" style={{ padding: "0.25rem 0.75rem", fontSize: "0.75rem" }}>
          Log out
        </button>
      </div>

      {/* Quick Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card flex flex-col justify-center" style={{ padding: "1rem", borderLeft: "4px solid var(--color-status-submitted-ring)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Total Assigned</p>
          <p className="text-2xl font-bold mt-1" style={{ color: "var(--color-text-base)" }}>{totalAssigned}</p>
        </div>
        <div className="card flex flex-col justify-center" style={{ padding: "1rem", borderLeft: "4px solid var(--color-status-resolved-ring)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Solved By Dept</p>
          <p className="text-2xl font-bold mt-1" style={{ color: "var(--color-status-resolved-text)" }}>{totalSolved}</p>
        </div>
        <div className="card flex flex-col justify-center" style={{ padding: "1rem", borderLeft: "4px solid #ef4444" }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Left To Solve</p>
          <p className="text-2xl font-bold mt-1" style={{ color: "#ef4444" }}>{totalLeft}</p>
        </div>
      </div>

      {resolvingId && (
        <div className="card mb-6" style={{ border: "2px solid var(--color-status-resolved-bg)" }}>
          <h3 className="font-semibold mb-4" style={{ color: "var(--color-text-base)" }}>Resolve Issue</h3>
          
          {!preview ? (
            <div
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem",
                padding: "1rem", border: "1px dashed var(--color-border)", borderRadius: "4px",
                backgroundColor: "var(--color-neutral-50)"
              }}
            >
              {cameraState === "idle" && (
                <button type="button" className="btn-primary" onClick={startCamera}>Start Camera</button>
              )}
              {cameraState === "active" && (
                <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                  <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", maxHeight: "300px", objectFit: "cover", borderRadius: "4px", backgroundColor: "#000" }} />
                  <button type="button" className="btn-primary" onClick={capturePhoto}>Capture Photo</button>
                </div>
              )}
              {cameraState === "denied" && (
                <div style={{ textAlign: "center" }}>
                  <p className="text-sm text-red-600 mb-2">{photoError}</p>
                  <button type="button" className="btn-secondary text-xs" onClick={startCamera}>Try Again</button>
                </div>
              )}
              <p className="text-[11px]" style={{ color: "var(--color-text-faint)", textAlign: "center", marginTop: "0.5rem" }}>
                A resolution photo is required to mark this issue as resolved.
              </p>
              <canvas ref={canvasRef} style={{ display: "none" }} />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Resolution preview" style={{ display: "block", maxWidth: "100%", maxHeight: "280px", borderRadius: "4px", border: "1px solid var(--color-border)", objectFit: "cover" }} />
              <div style={{ display: "flex", gap: "1rem" }}>
                <button type="button" className="btn-secondary" onClick={retakePhoto} disabled={isSubmitting}>Retake</button>
                <button type="button" className="btn-primary" onClick={submitResolution} disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Resolution"}
                </button>
              </div>
            </div>
          )}
          
          <button 
            type="button" 
            style={{ width: "100%", marginTop: "1rem", textAlign: "center", fontSize: "0.875rem", color: "var(--color-text-muted)", background: "transparent", border: "none", cursor: "pointer" }}
            onClick={() => { setResolvingId(null); setPhoto(null); setPreview(null); stopCamera(); }}
            disabled={isSubmitting}
          >
            Cancel Resolution
          </button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
        {pendingReports.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>No pending issues for your department.</p>
        ) : (
          pendingReports.map(r => (
            <div key={r.id} className="card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--color-text-faint)" }}>{r.ticket_number}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase" style={{ backgroundColor: "var(--color-neutral-100)", color: "var(--color-neutral-600)" }}>
                  {r.status.replace("_", " ")}
                </span>
              </div>
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-text-base)", textTransform: "capitalize" }}>
                {r.category.replace("_", " ")}
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {r.description}
              </p>
              
              {r.lat && r.lng && (
                <a 
                  href={`https://www.google.com/maps?q=${r.lat},${r.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs mt-1 inline-flex items-center gap-1"
                  style={{ color: "#3b82f6", textDecoration: "none", fontWeight: 500 }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Get Directions to Issue
                </a>
              )}
              
              {!resolvingId && (
                <button 
                  className="btn-primary"
                  style={{ width: "100%", marginTop: "0.5rem", justifyContent: "center" }}
                  onClick={() => { setResolvingId(r.id); window.scrollTo(0, 0); }}
                >
                  Mark Resolved
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
