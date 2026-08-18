import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    console.log("[TRANSCRIBE] file exists:", !!file);
    if (file) {
      console.log("[TRANSCRIBE] file name:", file.name);
      console.log("[TRANSCRIBE] file type:", file.type);
      console.log("[TRANSCRIBE] file size:", file.size);
    }

    if (!file) {
      return NextResponse.json({ success: false, error: "No audio file provided" }, { status: 400 });
    }

    if (file && file.size === 0) {
      return NextResponse.json({ success: false, error: "Uploaded audio file is empty" }, { status: 400 });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ success: false, error: "GROQ_API_KEY is not configured" }, { status: 500 });
    }

    // Prepare form data for Groq
    const groqFormData = new FormData();
    groqFormData.append("file", file);
    groqFormData.append("model", "whisper-large-v3");
    groqFormData.append("temperature", "0");
    groqFormData.append("response_format", "json");

    // Call Groq API
    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: groqFormData,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[transcribe] Groq API error:", errText);
      return NextResponse.json({ success: false, error: "Transcription failed via Groq API." }, { status: response.status });
    }

    const data = await response.json();
    console.log("[TRANSCRIBE] Groq status:", response.status);
    console.log("[TRANSCRIBE] Groq transcription:", data.text);

    // Temporarily disabled aggressive post-processing regex for debugging
    const text = (data.text || "").trim();

    if (!text) {
      return NextResponse.json({ success: false, error: "No speech was detected." }, { status: 400 });
    }

    console.log("[TRANSCRIBE] final transcription:", text);
    return NextResponse.json({ success: true, text });
  } catch (error) {
    console.error("[transcribe] Server error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
