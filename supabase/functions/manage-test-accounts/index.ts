import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check caller is king_admin
    const { data: callerRole } = await adminClient
      .from("user_roles").select("role").eq("user_id", caller.id).single();

    if (!callerRole || callerRole.role !== "king_admin") {
      return new Response(JSON.stringify({ error: "Only King Admin can manage test accounts" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action } = await req.json();

    if (action === "create") {
      // Look up org IDs
      const { data: churchOrg } = await adminClient
        .from("organizations").select("id").eq("name", "Pillars Erediauwa").single();
      const { data: groupOrg } = await adminClient
        .from("organizations").select("id").eq("name", "Erediauwa Group").single();

      if (!churchOrg || !groupOrg) {
        return new Response(JSON.stringify({ error: "Could not find Pillars Erediauwa or Erediauwa Group organizations. Please create them first." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const results: { index: number; email: string; success: boolean; error?: string }[] = [];

      for (let i = 0; i < TEST_ACCOUNTS.length; i++) {
        const acct = TEST_ACCOUNTS[i];
        const orgId = acct.org_key === "group" ? groupOrg.id : churchOrg.id;

        try {
          // Create auth user
          const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
            email: acct.email,
            password: "Test1234!",
            email_confirm: true,
            user_metadata: { full_name: acct.name },
          });

          if (createError) {
            results.push({ index: i, email: acct.email, success: false, error: createError.message });
            continue;
          }

          const userId = newUser.user.id;

          // Update profile
          await adminClient.from("profiles").update({
            full_name: acct.name,
            organization_id: orgId,
            role_title: acct.role_title,
            must_change_password: false,
          }).eq("user_id", userId);

          // Insert role
          await adminClient.from("user_roles").insert({
            user_id: userId,
            role: acct.role,
          });

          results.push({ index: i, email: acct.email, success: true });
        } catch (err: any) {
          results.push({ index: i, email: acct.email, success: false, error: err.message });
        }
      }

      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      // Find all users with @test.com emails
      const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
      if (listError) throw listError;

      const testUsers = users.filter(u => u.email?.endsWith("@test.com"));
      const deletedEmails: string[] = [];

      for (const user of testUsers) {
        // Delete from user_roles and profiles first (cascade should handle but be explicit)
        await adminClient.from("user_roles").delete().eq("user_id", user.id);
        await adminClient.from("profiles").delete().eq("user_id", user.id);
        const { error } = await adminClient.auth.admin.deleteUser(user.id);
        if (!error) deletedEmails.push(user.email || "");
      }

      return new Response(JSON.stringify({ success: true, deleted: deletedEmails.length, emails: deletedEmails }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
