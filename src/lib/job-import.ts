import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

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
function decode(value: string) {
  return value.replace(/<br\s*\/?\s*>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/\s+\n/g, "\n").replace(/[ \t]{2,}/g, " ").trim();
}
function findJobPosting(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) { for (const item of value) { const found = findJobPosting(item); if (found) return found; } }
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>; const type = object["@type"];
    if (type === "JobPosting" || Array.isArray(type) && type.includes("JobPosting")) return object;
    for (const child of Object.values(object)) { const found = findJobPosting(child); if (found) return found; }
  }
  return null;
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
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  let posting: Record<string, unknown> | null = null;
  for (const script of scripts) { try { posting = findJobPosting(JSON.parse(script[1])); if (posting) break; } catch { /* malformed third-party markup */ } }
  const organization = posting?.hiringOrganization as Record<string, unknown> | undefined;
  const meta = (property: string) => html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)`, "i"))?.[1];
  const title = String(posting?.title ?? meta("og:title") ?? html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  const description = decode(String(posting?.description ?? meta("description") ?? ""));
  if (!description || description.length < 80) throw new Error("We couldn't extract a complete description from this page. Paste it manually instead.");
  return { sourceUrl: url.toString(), company: decode(String(organization?.name ?? "")), role: decode(title).replace(/\s+[|–-]\s+.*$/, ""), jobDescription: description.slice(0, 50_000) };
}
