import Link from "next/link";
import { Brand } from "@/components/brand";

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-10 sm:px-8">
      <Brand /><article className="prose prose-neutral mt-14 max-w-none dark:prose-invert">
        <h1>Privacy Policy</h1><p>Last updated June 22, 2026.</p>
        <h2>What NodeHire stores</h2><p>NodeHire stores your authentication profile and the company, role, job description, and optional notes you submit. Anonymous demo data expires after 30 days unless transferred to an account.</p>
        <h2>Authentication and analytics</h2><p>Authentication is provided by Supabase. Google sign-in is optional. Privacy-friendly Vercel Analytics may collect aggregated visit information.</p>
        <h2>AI processing</h2><p>Phase 1 does not send prep contexts to an AI provider. Future AI features will explain provider processing before use. Do not submit secrets, confidential company material, or sensitive personal information.</p>
        <h2>Your choices</h2><p>You can edit or delete prep contexts at any time. Signed-in users can permanently delete their account from Settings.</p>
        <h2>Contact</h2><p>Contact the project creator through <a href="https://www.linkedin.com/in/bharadwaj-madduri/">LinkedIn</a>.</p>
      </article><Link href="/" className="mt-10 inline-block text-sm text-primary">← Return home</Link>
    </main>
  );
}
