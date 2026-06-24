import { getAnonymousSession } from "@/lib/anonymous-session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getOwnedPrepContext(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (auth.user) {
    const { data } = await supabase.from("prep_contexts").select("*").eq("id", id).maybeSingle();
    return data;
  }

  const anonymous = await getAnonymousSession();
  if (!anonymous) return null;
  const { data } = await createSupabaseAdminClient()
    .from("prep_contexts")
    .select("*")
    .eq("id", id)
    .eq("anonymous_session_id", anonymous.id)
    .maybeSingle();
  return data;
}
