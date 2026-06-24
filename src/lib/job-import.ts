import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { extractJobPage } from "@/lib/job-import-parser";

const MAX_BYTES = 1_500_000;
function privateAddress(address: string) {
  if (address === "::1" || address === "0.0.0.0") return true;
  if (address.startsWith("fc") || address.startsWith("fd") || address.startsWith("fe80:")) return true;
  const parts = address.split(".").map(Number);
  return parts.length === 4 && (parts[0] === 10 || parts[0] === 127 || parts[0] === 0 || (parts[0] === 169 && parts[1] === 254) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168));
}
async function safeUrl(value: string) {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("Only public HTTP(S) job links are supported.");
  if (url.hostname === "localhost" || isIP(url.hostname) && privateAddress(url.hostname)) throw new Error("Private network URLs are not allowed.");
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some((item) => privateAddress(item.address))) throw new Error("Private network URLs are not allowed.");
  return url;
}
export async function importJobUrl(input: string) {
  let url = await safeUrl(input);
  let response: Response | null = null;
  for (let redirects = 0; redirects < 4; redirects += 1) {
    response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(8_000), headers: { "User-Agent": "NodeHire Job Importer/1.0" }, cache: "no-store" });
    if (response.status >= 300 && response.status < 400) { const location = response.headers.get("location"); if (!location) break; url = await safeUrl(new URL(location, url).toString()); continue; }
    break;
  }
  if (!response?.ok) throw new Error(response?.status === 401 || response?.status === 403 ? "This job site blocks automatic import. Paste the job description manually instead." : "The job page could not be loaded.");
  if (Number(response.headers.get("content-length") || 0) > MAX_BYTES) throw new Error("The job page is too large to import safely.");
  const reader = response.body?.getReader(); if (!reader) throw new Error("The job page returned no readable content.");
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > MAX_BYTES) { await reader.cancel(); throw new Error("The job page is too large to import safely."); } chunks.push(value); }
  const html = new TextDecoder().decode(Buffer.concat(chunks));
  const job = extractJobPage(html, url.toString());
  if (!job.jobDescription || job.jobDescription.length < 80) throw new Error("We couldn't extract a complete description from this page. Paste it manually instead.");
  return { sourceUrl: url.toString(), ...job };
}
