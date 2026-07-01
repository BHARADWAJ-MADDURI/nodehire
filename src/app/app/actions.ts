"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAnonymousSession } from "@/lib/anonymous-session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PrepContextState = { error?: string };

const prepContextSchema = z.object({
  id: z.union([z.uuid(), z.literal("")]).optional(),
  company: z.string().trim().min(1, "Company is required.").max(100),
  role: z.string().trim().min(1, "Target role is required.").max(150),
  jobDescription: z.string().trim().min(1, "Job description is required.").max(50_000),
  seniority: z.string().trim().max(80).optional(),
  interviewDate: z.union([z.iso.date(), z.literal("")]).optional(),
  notes: z.string().trim().max(2_000).optional(),
});

async function owner() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) return { kind: "user" as const, id: data.user.id, supabase };
  const anonymous = await getAnonymousSession();
  if (anonymous) return { kind: "anonymous" as const, id: anonymous.id };
  redirect("/");
}

export async function savePrepContext(
  _state: PrepContextState,
  formData: FormData,
): Promise<PrepContextState> {
  const parsed = prepContextSchema.safeParse({
    id: formData.get("id") || "",
    company: formData.get("company"),
    role: formData.get("role"),
    jobDescription: formData.get("jobDescription"),
    seniority: formData.get("seniority"),
    interviewDate: formData.get("interviewDate"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const currentOwner = await owner();
  const values = {
    company: parsed.data.company,
    role: parsed.data.role,
    job_description: parsed.data.jobDescription,
    seniority: parsed.data.seniority || null,
    interview_date: parsed.data.interviewDate || null,
    notes: parsed.data.notes || null,
  };
  const id = parsed.data.id || null;
  let savedId = id;

  if (currentOwner.kind === "user") {
    const query = id
      ? currentOwner.supabase.from("prep_contexts").update(values).eq("id", id).select("id").single()
      : currentOwner.supabase.from("prep_contexts").insert({ ...values, user_id: currentOwner.id }).select("id").single();
    const { data, error } = await query;
    if (error) return { error: "We could not save this prep context." };
    savedId = data.id;
  } else {
    const admin = createSupabaseAdminClient();
    if (!id) {
      const { count } = await admin.from("prep_contexts").select("id", { count: "exact", head: true }).eq("anonymous_session_id", currentOwner.id);
      if ((count ?? 0) >= 3) return { error: "Guest sessions can save up to three prep contexts." };
    }
    const query = id
      ? admin.from("prep_contexts").update(values).eq("id", id).eq("anonymous_session_id", currentOwner.id).select("id").single()
      : admin.from("prep_contexts").insert({ ...values, anonymous_session_id: currentOwner.id }).select("id").single();
    const { data, error } = await query;
    if (error) return { error: "We could not save this prep context." };
    savedId = data.id;
  }

  revalidatePath("/app");
  redirect(`/app/topics/${savedId}`);
}

export async function deletePrepContext(formData: FormData) {
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  const currentOwner = await owner();
  if (currentOwner.kind === "user") {
    await currentOwner.supabase.from("prep_contexts").delete().eq("id", id.data);
  } else {
    await createSupabaseAdminClient().from("prep_contexts").delete().eq("id", id.data).eq("anonymous_session_id", currentOwner.id);
  }
  revalidatePath("/app");
}
