import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEST_ACCOUNTS = [
  { name: "Test Cell Leader", email: "cell@test.com", role: "cell_leader", role_title: "Cell Leader", org_key: "church" },
  { name: "Test Follow-Up Staff", email: "followup@test.com", role: "follow_up_team", role_title: "Follow-Up Staff", org_key: "church" },
  { name: "Test Reception", email: "reception@test.com", role: "reception_team", role_title: "Reception Team", org_key: "church" },
  { name: "Test FS Staff", email: "fsstaff@test.com", role: "foundation_school_staff", role_title: "Foundation School Staff", org_key: "church" },
  { name: "Test Dept Leader", email: "dept@test.com", role: "department_head", role_title: "Department Leader", org_key: "church" },
  { name: "Test Church Pastor", email: "pastor@test.com", role: "church_pastor", role_title: "Church Pastor", org_key: "church" },
  { name: "Test Group Admin", email: "group@test.com", role: "erediauwa_admin", role_title: "Erediauwa Admin", org_key: "group" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is king_admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: callerRole } = await adminClient
      .from("user_roles").select("role").eq("user_id", caller.id).single();

    if (!callerRole || callerRole.role !== "king_admin") {
      return new Response(JSON.stringify({ error: "Only King Admin can manage test accounts" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action } = await req.json();
    console.log("Action:", action);

    if (action === "create") {
      // Look up org IDs
      const { data: churchOrg, error: churchErr } = await adminClient
        .from("organizations").select("id").eq("name", "Pillars Erediauwa").single();
      const { data: groupOrg, error: groupErr } = await adminClient
        .from("organizations").select("id").eq("name", "Erediauwa Group").single();

      console.log("Church org:", churchOrg, "error:", churchErr);
      console.log("Group org:", groupOrg, "error:", groupErr);

      if (!churchOrg || !groupOrg) {
        return new Response(JSON.stringify({ error: "Could not find Pillars Erediauwa or Erediauwa Group organizations." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const results: { email: string; success: boolean; error?: string }[] = [];

      for (const acct of TEST_ACCOUNTS) {
        const orgId = acct.org_key === "group" ? groupOrg.id : churchOrg.id;
        console.log(`Creating ${acct.email} with role ${acct.role}, org ${orgId}`);

        try {
          const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
            email: acct.email,
            password: "Test1234!",
            email_confirm: true,
            user_metadata: { full_name: acct.name },
          });

          if (createError) {
            console.error(`Auth error for ${acct.email}:`, createError.message);
            if (createError.message.includes("already been registered") || createError.message.includes("already exists")) {
              results.push({ email: acct.email, success: false, error: "Already exists, skipped" });
              continue;
            }
            results.push({ email: acct.email, success: false, error: createError.message });
            continue;
          }

          const userId = newUser.user.id;
          console.log(`User created: ${acct.email} -> ${userId}`);

          // Update profile (trigger auto-creates it via handle_new_user)
          const { error: profErr } = await adminClient.from("profiles").update({
            full_name: acct.name,
            organization_id: orgId,
            role_title: acct.role_title,
            must_change_password: false,
          }).eq("user_id", userId);

          if (profErr) console.error(`Profile update error for ${acct.email}:`, profErr.message);

          // Insert role
          const { error: roleErr } = await adminClient.from("user_roles").insert({
            user_id: userId,
            role: acct.role,
          });

          if (roleErr) console.error(`Role insert error for ${acct.email}:`, roleErr.message);

          results.push({ email: acct.email, success: true });
        } catch (err: any) {
          console.error(`Unexpected error for ${acct.email}:`, err.message);
          results.push({ email: acct.email, success: false, error: err.message });
        }
      }

      return new Response(JSON.stringify({ success: true, results }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
      if (listError) throw listError;

      const testUsers = users.filter(u => u.email?.endsWith("@test.com"));
      const deletedEmails: string[] = [];

      for (const user of testUsers) {
        console.log(`Deleting test user: ${user.email}`);
        await adminClient.from("user_roles").delete().eq("user_id", user.id);
        await adminClient.from("profiles").delete().eq("user_id", user.id);
        const { error } = await adminClient.auth.admin.deleteUser(user.id);
        if (!error) deletedEmails.push(user.email || "");
        else console.error(`Delete error for ${user.email}:`, error.message);
      }

      return new Response(JSON.stringify({ success: true, deleted: deletedEmails.length, emails: deletedEmails }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Top-level error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
