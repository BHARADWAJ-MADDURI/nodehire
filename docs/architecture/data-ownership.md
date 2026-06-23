# Phase 1 data ownership

Authenticated prep contexts use Supabase Auth UUIDs and are protected directly by row-level security. Anonymous prep contexts are accessed only by NodeHire server routes after validating the signed, HTTP-only session cookie; browser clients never receive service-role credentials.

An anonymous session owns at most three prep contexts at the application layer and expires after 30 days. When the visitor signs in, the server validates the anonymous cookie and transfers its prep contexts to the authenticated user. Unclaimed expired sessions are deleted by the cleanup job, cascading to their prep contexts.
