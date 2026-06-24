import Link from "next/link";
import { Brand } from "@/components/brand";

export default function TermsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-10 sm:px-8">
      <Brand /><article className="prose prose-neutral mt-14 max-w-none dark:prose-invert">
        <h1>Terms of Use</h1><p>Last updated June 22, 2026.</p>
        <h2>Purpose</h2><p>NodeHire is an open-source educational portfolio project. It provides interview-preparation assistance and does not guarantee employment, interview outcomes, or factual completeness.</p>
        <h2>Acceptable use</h2><p>Do not abuse the service, attempt unauthorized access, upload unlawful material, or submit information you do not have permission to process.</p>
        <h2>Your content</h2><p>You retain responsibility for the content you submit. You grant NodeHire only the limited permission needed to store and process that content to provide the requested features.</p>
        <h2>Availability</h2><p>The free public service is provided as-is and may be changed, rate-limited, or unavailable. Free-tier infrastructure may impose additional limits.</p>
        <h2>Open source</h2><p>The source code is available under the MIT License. These service terms do not replace the repository license.</p>
      </article><Link href="/" className="mt-10 inline-block text-sm text-primary">← Return home</Link>
    </main>
  );
}
