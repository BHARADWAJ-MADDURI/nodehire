import { NextResponse } from "next/server";
import { z } from "zod";
import { encryptProviderKey } from "@/lib/providers/encryption";
import { ProviderError } from "@/lib/providers/types";
import { validateProviderKey } from "@/lib/providers/validate";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const provider = z.enum(["gemini", "openai", "anthropic"]);
const connectSchema = z.object({ provider, apiKey: z.string().trim().min(10).max(500), remember: z.boolean().default(false) });

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ connected: [] });
  const { data: keys } = await createSupabaseAdminClient().from("user_provider_keys").select("provider, updated_at").eq("user_id", data.user.id);
  return NextResponse.json({ connected: keys ?? [] });
}

export async function POST(request: Request) {
  const parsed = connectSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid provider key." }, { status: 400 });
  try {
    await validateProviderKey(parsed.data.provider, parsed.data.apiKey);
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (parsed.data.remember && !data.user) return NextResponse.json({ error: "Sign in to remember a provider key." }, { status: 401 });
    if (parsed.data.remember && data.user) {
      const envelope = encryptProviderKey(parsed.data.apiKey, data.user.id, parsed.data.provider);
      const { error } = await createSupabaseAdminClient().from("user_provider_keys").upsert({ user_id: data.user.id, provider: parsed.data.provider, encrypted_key: envelope, updated_at: new Date().toISOString() }, { onConflict: "user_id,provider" });
      if (error) throw new Error("Encrypted key persistence failed.");
    }
    return NextResponse.json({ ok: true, provider: parsed.data.provider, persisted: parsed.data.remember });
  } catch (error) {
    if (error instanceof ProviderError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    return NextResponse.json({ error: "The provider key could not be connected.", code: "PROVIDER_UNAVAILABLE" }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const value = provider.safeParse(new URL(request.url).searchParams.get("provider"));
  if (!value.success) return NextResponse.json({ error: "Invalid provider." }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  await createSupabaseAdminClient().from("user_provider_keys").delete().eq("user_id", data.user.id).eq("provider", value.data);
  return NextResponse.json({ ok: true });
}
