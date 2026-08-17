"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import GoogleSignIn from "@/components/GoogleSignIn";

/* ── Constants ──────────────────────────────────────────── */
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES  = ["image/jpeg", "image/png", "image/webp", "image/heic"];

/* ── GPS state machine values ───────────────────────────── */
const GEO = { IDLE: "idle", LOCATING: "locating", OK: "ok", DENIED: "denied", UNAVAILABLE: "unavailable" };

/* ── Form submission state machine values ───────────────── */
const FORM = { IDLE: "idle", SUBMITTING: "submitting", SUCCESS: "success", ERROR: "error" };

export default function ReportForm() {
  const { user } = useAuth();
  /* ── Photo state ────────────────────────────────────────── */
  const [photo, setPhoto]         = useState(null);   // File object
  const [preview, setPreview]     = useState(null);   // Object URL for <img>
  const [photoError, setPhotoError] = useState("");
  const fileInputRef = useRef(null);

  /* ── Description state ──────────────────────────────────── */
  const [description, setDescription] = useState("");

  /* ── GPS state ──────────────────────────────────────────── */
  const [geoState, setGeoState] = useState(GEO.IDLE);
  const [coords, setCoords]     = useState(null); // { lat, lng }
  const [geoError, setGeoError] = useState("");

  /* ── Form submission state ──────────────────────────────── */
  const [formState, setFormState]     = useState(FORM.IDLE);
  const [submitError, setSubmitError] = useState("");
  const [submittedReport, setSubmittedReport] = useState(null);

  /* ── Auto-request GPS on mount ───────────────────────────── */
  useEffect(() => {
    requestLocation();
  }, []);

  /* ── Revoke preview URL when component unmounts ─────────── */
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  /* ── Handlers ────────────────────────────────────────────── */

  function requestLocation() {
    if (!navigator.geolocation) {
      setGeoState(GEO.UNAVAILABLE);
      setGeoError("Your browser does not support GPS location.");
      return;
    }
    setGeoState(GEO.LOCATING);
    setGeoError("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoState(GEO.OK);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGeoState(GEO.DENIED);
          setGeoError(
            "Location permission was denied. Please allow location access in your browser settings and try again."
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGeoState(GEO.UNAVAILABLE);
          setGeoError("Your location could not be determined. Check that GPS is enabled and try again.");
        } else {
          setGeoState(GEO.UNAVAILABLE);
          setGeoError("Location request timed out. Please try again.");
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    setPhotoError("");

    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setPhotoError("Only JPEG, PNG, WebP, or HEIC images are accepted.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setPhotoError(`Image is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed is 5 MB.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Revoke previous preview before creating a new one
    if (preview) URL.revokeObjectURL(preview);
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  function removePhoto() {
    if (preview) URL.revokeObjectURL(preview);
    setPhoto(null);
    setPreview(null);
    setPhotoError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");

    // ── Client-side validation ──────────────────────────────
    if (!photo) {
      setSubmitError("Please attach a photo of the issue.");
      return;
    }
    if (!description.trim()) {
      setSubmitError("Please describe the issue.");
      return;
    }
    if (geoState !== GEO.OK || !coords) {
      setSubmitError(
        geoState === GEO.DENIED
          ? "Location permission is required to submit a report. " + geoError
          : "Waiting for your GPS location. Please try again in a moment."
      );
      return;
    }

    setFormState(FORM.SUBMITTING);

    try {
      // ── 1. Upload photo to Supabase Storage ─────────────────
      const ext       = photo.name.split(".").pop();
      const timestamp = Date.now();
      // Use a deterministic-enough path; user_id added later when auth is wired
      const storagePath = `uploads/${timestamp}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("report-photos")
        .upload(storagePath, photo, {
          contentType: photo.type,
          upsert: false,
        });

      if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`);

      // ── 2. Get the public URL for the uploaded file ─────────
      const { data: urlData } = supabase.storage
        .from("report-photos")
        .getPublicUrl(storagePath);

      const photoUrl = urlData.publicUrl;

      // ── 3. Classify issue description using AI ───────────────
      let category = "Other";
      let urgency = 3;
      try {
        const classifyRes = await fetch("/api/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: description.trim() }),
        });
        if (classifyRes.ok) {
          const classification = await classifyRes.json();
          if (classification.category) category = classification.category;
          if (classification.urgency) urgency = classification.urgency;
        } else {
          console.warn("Classification failed (status", classifyRes.status, "), using defaults");
        }
      } catch (err) {
        console.warn("Classification error, using defaults:", err);
      }

      // ── 4. Insert report row ─────────────────────────────────
      const { data: inserted, error: insertError } = await supabase
        .from("reports")
        .insert({
          user_id:     user.id,
          photo_url:   photoUrl,
          description: description.trim(),
          lat:         coords.lat,
          lng:         coords.lng,
          category:    category,
          urgency:     urgency,
          status:      "SUBMITTED",
        })
        .select("*")
        .single();

      if (insertError) throw new Error(`Could not save report: ${insertError.message}`);

      // ── 5. Save report ID to localStorage ────────────────────
      try {
        const savedIds = JSON.parse(localStorage.getItem("myReportIds") || "[]");
        if (!savedIds.includes(inserted.id)) {
          savedIds.push(inserted.id);
          localStorage.setItem("myReportIds", JSON.stringify(savedIds));
        }
      } catch (storageErr) {
        console.warn("Failed to save report ID to localStorage", storageErr);
      }

      setSubmittedReport(inserted);
      setFormState(FORM.SUCCESS);

    } catch (err) {
      console.error(err);
      setSubmitError(err.message || "Something went wrong. Please try again.");
      setFormState(FORM.ERROR);
    }
  }

  /* ── Success screen ─────────────────────────────────────── */
  if (formState === FORM.SUCCESS && submittedReport) {
    return (
      <div className="card text-center" style={{ padding: "3rem 2rem", border: "2px solid var(--color-status-resolved-ring)" }}>
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            backgroundColor: "var(--color-status-resolved-bg)",
            color: "var(--color-status-resolved-text)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.5rem",
            fontSize: "1.75rem",
          }}
        >
          ✓
        </div>
        <h2 style={{ color: "var(--color-text-base)", marginBottom: "0.5rem", fontSize: "1.25rem", fontWeight: 600 }}>
          Report submitted successfully
        </h2>
        <p className="text-sm" style={{ color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
          Thank you for reporting this issue. City staff will review it shortly.
        </p>
        
        <div 
          style={{ 
            backgroundColor: "var(--color-neutral-50)", 
            padding: "1.5rem", 
            borderRadius: "6px", 
            border: "1px solid var(--color-border)",
            marginBottom: "1.5rem"
          }}
        >
          <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--color-text-faint)", marginBottom: "0.5rem" }}>
            Your Ticket Number
          </p>
          <p 
            className="font-mono" 
            style={{ 
              fontSize: "2rem", 
              fontWeight: 700, 
              color: "var(--color-text-base)",
              letterSpacing: "0.05em",
              marginBottom: "1rem"
            }}
          >
            {submittedReport.ticket_number || submittedReport.id.split("-")[0]}
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)", marginBottom: "1rem" }}>
            Save this ticket number to track your report's status.
          </p>
          
          <div style={{ display: "flex", justifyContent: "space-between", textAlign: "left", borderTop: "1px solid var(--color-border)", paddingTop: "1rem", marginTop: "1rem" }}>
            <div>
              <p className="text-xs font-semibold" style={{ color: "var(--color-text-faint)", textTransform: "uppercase" }}>Category</p>
              <p className="text-sm font-medium" style={{ color: "var(--color-neutral-700)" }}>{submittedReport.category}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p className="text-xs font-semibold" style={{ color: "var(--color-text-faint)", textTransform: "uppercase" }}>Priority</p>
              <p className="text-sm font-medium" style={{ color: "var(--color-neutral-700)" }}>Level {submittedReport.urgency}</p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", flexDirection: "column" }}>
          <a href={`/track/${submittedReport.id}`} className="btn-primary" style={{ textDecoration: "none", display: "inline-flex", justifyContent: "center", padding: "0.75rem 1.5rem" }}>
            Track this report
          </a>
          <button
            type="button"
            className="btn-secondary"
            style={{ justifyContent: "center", padding: "0.75rem 1.5rem" }}
            onClick={() => {
              setFormState(FORM.IDLE);
              setPhoto(null);
              setPreview(null);
              setDescription("");
              setSubmittedReport(null);
              setSubmitError("");
            }}
          >
            Submit another report
          </button>
        </div>
      </div>
    );
  }

  /* ── Main form ──────────────────────────────────────────── */
  const isSubmitting = formState === FORM.SUBMITTING;

  return (
    <form onSubmit={handleSubmit} noValidate>

      {/* ── Photo upload ──────────────────────────────────── */}
      <div className="card mb-6">
        <h3 className="text-base font-semibold mb-1" style={{ color: "var(--color-text-base)" }}>1. Photo Evidence</h3>
        <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>A clear photo helps city staff locate and assess the issue quickly.</p>

        {!preview ? (
          <label
            htmlFor="photo-upload"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              padding: "2rem",
              border: "1px dashed var(--color-border)",
              borderRadius: "4px",
              cursor: "pointer",
              backgroundColor: "var(--color-neutral-50)",
              transition: "border-color 140ms ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
          >
            <span style={{ fontSize: "1.75rem" }}>📷</span>
            <span className="text-sm" style={{ color: "var(--color-text-muted)", fontWeight: 500 }}>
              Take a photo
            </span>
            <span className="text-xs" style={{ color: "var(--color-text-faint)" }}>
              JPEG, PNG, WebP or HEIC · max 5 MB
            </span>
            <input
              id="photo-upload"
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              capture="environment"
              onChange={handlePhotoChange}
              disabled={isSubmitting}
              style={{ display: "none" }}
            />
          </label>
        ) : (
          <div style={{ position: "relative", display: "inline-block" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Selected photo preview"
              style={{
                display: "block",
                maxWidth: "100%",
                maxHeight: "280px",
                borderRadius: "4px",
                border: "1px solid var(--color-border)",
                objectFit: "cover",
              }}
            />
            <button
              type="button"
              onClick={removePhoto}
              disabled={isSubmitting}
              aria-label="Remove photo"
              style={{
                position: "absolute",
                top: "0.5rem",
                right: "0.5rem",
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                backgroundColor: "#1C1917CC",
                border: "none",
                color: "#fff",
                fontSize: "0.75rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>
          </div>
        )}

        {photoError && (
          <p className="text-xs mt-2" style={{ color: "#dc2626" }}>
            {photoError}
          </p>
        )}
      </div>

      {/* ── Description ───────────────────────────────────── */}
      <div className="card mb-6">
        <h3 className="text-base font-semibold mb-1" style={{ color: "var(--color-text-base)" }}>2. Issue Details</h3>
        <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>Provide enough detail so workers know what to bring.</p>
        
        <label className="form-label" htmlFor="description">
          Description <span style={{ color: "#dc2626" }}>*</span>
        </label>
        <textarea
          id="description"
          className="form-input"
          placeholder="Describe the issue — where is it exactly and how severe?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting}
          rows={4}
          maxLength={1000}
          style={{ resize: "vertical", minHeight: "96px" }}
        />
        <p
          className="text-xs"
          style={{
            color: "var(--color-text-faint)",
            marginTop: "0.25rem",
            textAlign: "right",
          }}
        >
          {description.length}/1000
        </p>
      </div>

      {/* ── GPS status ────────────────────────────────────── */}
      <div className="card mb-8">
        <h3 className="text-base font-semibold mb-1" style={{ color: "var(--color-text-base)" }}>3. Location</h3>
        <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>Your location is automatically captured for accuracy.</p>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0.625rem",
            padding: "0.75rem",
            borderRadius: "4px",
            border: "1px solid var(--color-border)",
            backgroundColor:
              geoState === GEO.OK      ? "var(--color-status-resolved-bg)"  :
              geoState === GEO.DENIED  ? "var(--color-status-submitted-bg)" :
              geoState === GEO.UNAVAILABLE ? "var(--color-status-submitted-bg)" :
              "var(--color-neutral-50)",
          }}
        >
          <span style={{ fontSize: "1rem", flexShrink: 0, marginTop: "1px" }}>
            {geoState === GEO.OK         ? "📍" :
             geoState === GEO.LOCATING   ? "⏳" :
             geoState === GEO.DENIED     ? "🔒" : "⚠️"}
          </span>
          <div>
            {geoState === GEO.OK && coords && (
              <>
                <p className="text-sm" style={{ color: "var(--color-status-resolved-text)", fontWeight: 500 }}>
                  Location captured
                </p>
                <p className="text-xs" style={{ color: "var(--color-text-muted)", marginTop: "1px", fontFamily: "monospace" }}>
                  {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </p>
              </>
            )}
            {geoState === GEO.LOCATING && (
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                Detecting your location…
              </p>
            )}
            {(geoState === GEO.DENIED || geoState === GEO.UNAVAILABLE) && (
              <>
                <p
                  className="text-sm"
                  style={{ color: "var(--color-status-submitted-text)", fontWeight: 500 }}
                >
                  {geoState === GEO.DENIED ? "Location permission denied" : "Location unavailable"}
                </p>
                <p className="text-xs" style={{ color: "var(--color-text-muted)", marginTop: "2px" }}>
                  {geoError}
                </p>
                <button
                  type="button"
                  className="text-xs"
                  onClick={requestLocation}
                  style={{
                    color: "var(--color-accent)",
                    textDecoration: "underline",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    marginTop: "4px",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  Try again
                </button>
              </>
            )}
            {geoState === GEO.IDLE && (
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                Requesting location…
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Error banner ──────────────────────────────────── */}
      {(formState === FORM.ERROR || submitError) && (
        <div
          role="alert"
          style={{
            padding: "0.75rem",
            marginBottom: "1rem",
            borderRadius: "4px",
            backgroundColor: "var(--color-status-submitted-bg)",
            border: "1px solid var(--color-status-submitted-ring)",
            color: "var(--color-status-submitted-text)",
            fontSize: "0.875rem",
          }}
        >
          {submitError}
        </div>
      )}

      {/* ── Submit / Sign In ──────────────────────────────────── */}
      {!user ? (
        <div style={{ textAlign: "center", padding: "1rem 0" }}>
          <p className="text-sm mb-3" style={{ color: "var(--color-text-muted)" }}>
            Please sign in to submit a report.
          </p>
          <GoogleSignIn className="btn-primary w-full justify-center" />
        </div>
      ) : (
        <button
          type="submit"
          id="submit-report-btn"
          className="btn-primary"
          disabled={isSubmitting || geoState === GEO.LOCATING}
          style={{ width: "100%", justifyContent: "center" }}
        >
          {isSubmitting ? "Submitting…" : "Submit report"}
        </button>
      )}
    </form>
  );
}
