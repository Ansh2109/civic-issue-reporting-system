import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return Response.json({ error: "Missing authorization header" }, { status: 401 });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return Response.json({ error: "Server configuration error: missing service role key" }, { status: 500 });
    }
    
    // Create admin client
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceRoleKey,
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    );

    // Verify caller is actually logged in
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

    const { email } = await request.json();
    if (!email) {
      return Response.json({ error: "Missing email address" }, { status: 400 });
    }

    // Lookup user by email to get their ID (admin API required)
    // List users filtered by email (this requires admin privileges)
    // Supabase JS doesn't have a direct "getUserByEmail" that is easy without listing, 
    // so we can list users (up to 1000) and find the match, OR just use admin.updateUserById if we had the ID.
    // Actually, Supabase has admin.updateUserById, but not by email easily.
    // Let's get the user ID from the profiles table instead, since email isn't in profiles... Wait, we can list users.
    const { data: usersData, error: listError } = await adminSupabase.auth.admin.listUsers();
    
    if (listError) {
      throw listError;
    }

    const targetUser = usersData.users.find(u => u.email === email);
    if (!targetUser) {
      return Response.json({ error: "User not found with that email" }, { status: 404 });
    }

    // Generate a new secure temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8) + "!";

    // Force update the password
    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
      targetUser.id,
      { password: tempPassword }
    );

    if (updateError) {
      throw updateError;
    }

    return Response.json({ success: true, email, tempPassword });

  } catch (error) {
    console.error("Error in reset password route:", error);
    return Response.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
