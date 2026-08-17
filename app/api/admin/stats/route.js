import { createClient } from "@supabase/supabase-js";

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return Response.json({ error: "Missing authorization header" }, { status: 401 });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return Response.json({ error: "Server configuration error: missing service role key" }, { status: 500 });
    }
    
    // Create admin client to bypass RLS
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceRoleKey,
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    // Verify caller is logged in
    const { data: { user }, error: authError } = await adminSupabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify caller is an admin
    const { data: callerProfile, error: profileError } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || callerProfile?.role !== "admin") {
      return Response.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Fetch the citizen count securely, bypassing the RLS that blocks admins from reading other user's profiles
    const { count, error: countError } = await adminSupabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "citizen");

    if (countError) throw countError;

    return Response.json({ totalCitizens: count || 0 });

  } catch (error) {
    console.error("Error in stats route:", error);
    return Response.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
