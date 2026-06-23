"use server";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function deleteAccount(formData: FormData) {
  if (formData.get("confirmation") !== "delete") redirect("/settings?error=confirmation");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/");

  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(data.user.id);
  if (error) redirect("/settings?error=delete");

  await supabase.auth.signOut();
  redirect("/?account=deleted");
}
