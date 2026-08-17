import { createClient } from "@supabase/supabase-js";
import { supabase as clientSupabase } from "@/lib/supabase";

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return Response.json({ error: "Missing authorization header" }, { status: 401 });
    }

    const { data: { user }, error: authError } = await clientSupabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return Response.json({ error: "Server configuration error: missing service role key" }, { status: 500 });
    }
    
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { data: callerProfile, error: profileError } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || callerProfile?.role !== "admin") {
      console.error("Profile check failed:", profileError || "Not an admin");
      return Response.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { full_name, email, phone_number, department } = await request.json();
    if (!full_name || !email || !phone_number || !department) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8) + "!";

    const { data: newUser, error: createUserError } = await adminSupabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    });

    if (createUserError) {
      return Response.json({ error: createUserError.message }, { status: 400 });
    }

    const { error: insertProfileError } = await adminSupabase
      .from("profiles")
      .upsert({
        id: newUser.user.id,
        role: "worker",
        full_name,
        phone_number,
        department,
        updated_at: new Date().toISOString()
      });

    if (insertProfileError) {
      return Response.json({ error: "User created but profile creation failed: " + insertProfileError.message }, { status: 500 });
    }

    return Response.json({ email, tempPassword });

  } catch (error) {
    console.error("Create worker error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
