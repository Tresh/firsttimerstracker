import type { AppRole } from "@/contexts/AuthContext";

// Known group org IDs — update these if your org UUIDs change
const GROUP_IDS: Record<string, string> = {
  erediauwa_admin: "00000000-0000-0000-0000-000000000001",
  loveworldcity_admin: "00000000-0000-0000-0000-000000000002",
  youth_teens_admin: "00000000-0000-0000-0000-000000000003",
};

/**
 * Apply organization scoping to a Supabase query based on user role.
 * Pass any `.from("members").select(...)` style query builder.
 *
 * @param query - Supabase query builder (must have .eq / .in / .or methods)
 * @param role - Current user's app role
 * @param organizationId - Current user's organization_id from profile
 * @param column - The column to filter on (default: "organization_id")
 */
export function scopeQuery<T extends { eq: Function; in: Function; or: Function }>(
  query: T,
  role: AppRole | null,
  organizationId: string | null,
  column: string = "organization_id"
): T {
  if (!role) return query;

  // King admin / admin see everything
  if (role === "king_admin" || role === "admin") return query;

  // Group admins see their group + child churches
  if (role === "erediauwa_admin") {
    const gid = GROUP_IDS.erediauwa_admin;
    return query.or(`${column}.eq.${gid},${column}.in.(select id from organizations where parent_id='${gid}')`) as T;
  }
  if (role === "loveworldcity_admin") {
    const gid = GROUP_IDS.loveworldcity_admin;
    return query.or(`${column}.eq.${gid},${column}.in.(select id from organizations where parent_id='${gid}')`) as T;
  }
  if (role === "youth_teens_admin") {
    const gid = GROUP_IDS.youth_teens_admin;
    return query.or(`${column}.eq.${gid},${column}.in.(select id from organizations where parent_id='${gid}')`) as T;
  }

  // Church-level roles — scope to own organization
  if (organizationId) {
    return query.eq(column, organizationId) as T;
  }

  return query;
}
