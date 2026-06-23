import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("anonymous_sessions")
    .delete()
    .is("claimed_by", null)
    .lt("expires_at", new Date().toISOString())
    .select("id");

  if (error) {
    return Response.json({ error: "Cleanup failed" }, { status: 500 });
  }

  return Response.json({ deleted: data?.length ?? 0 });
}
