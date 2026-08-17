import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return Response.json({ error: "Server configuration error" }, { status: 500 });
    }
    
    // We use the service_role key to bypass the strict RLS policies on the reports table.
    // We explicitly only select fields that are safe for the public map, preventing exposure
    // of user_id or other private information.
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceRoleKey,
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    const { data, error } = await adminSupabase
      .from("reports")
      .select("id, lat, lng, photo_url, category, ticket_number, description, urgency, status, created_at")
      .neq("status", "RESOLVED")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return Response.json({ reports: data || [] });

  } catch (error) {
    console.error("Error in map reports route:", error);
    return Response.json(
      { error: "Failed to load public map data" },
      { status: 500 }
    );
  }
}
