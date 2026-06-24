function decodeEntities(value: string) {
  const named: Record<string, string> = {
    amp: "&", quot: '"', apos: "'", "#39": "'", nbsp: " ",
    ldquo: "“", rdquo: "”", lsquo: "‘", rsquo: "’", ndash: "–", mdash: "—",
  };
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, key: string) => {
    if (key.startsWith("#x")) return String.fromCodePoint(Number.parseInt(key.slice(2), 16));
    if (key.startsWith("#")) return String.fromCodePoint(Number.parseInt(key.slice(1), 10));
    return named[key.toLowerCase()] ?? entity;
  });
}

export function htmlToText(value: string) {
  return decodeEntities(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "\n- ")
    .replace(/<\/(?:p|div|section|li|ul|ol|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function findJobPosting(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) {
    for (const item of value) { const found = findJobPosting(item); if (found) return found; }
  }
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    const type = object["@type"];
    if (type === "JobPosting" || Array.isArray(type) && type.includes("JobPosting")) return object;
    for (const child of Object.values(object)) { const found = findJobPosting(child); if (found) return found; }
  }
  return null;
}

function metaContent(html: string, key: string) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const name = tag.match(/(?:property|name)=["']([^"']+)["']/i)?.[1];
    if (name?.toLowerCase() !== key.toLowerCase()) continue;
    return tag.match(/content=["']([^"']*)["']/i)?.[1] ?? "";
  }
  return "";
}

function visibleJobDescription(html: string) {
  const heading = /<h[1-6]\b[^>]*>\s*(?:job\s+)?description\s*<\/h[1-6]>/i.exec(html);
  if (!heading) return "";
  const afterHeading = html.slice(heading.index + heading[0].length);
  const end = /<h[1-6]\b[^>]*(?:class=["'][^"']*job-details[^"']*["'])?[^>]*>\s*(?:job details|share this job|apply now)\s*<\/h[1-6]>/i.exec(afterHeading);
  return htmlToText(end ? afterHeading.slice(0, end.index) : afterHeading).slice(0, 50_000);
}

export function extractJobPage(html: string, sourceUrl: string) {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  let posting: Record<string, unknown> | null = null;
  for (const script of scripts) {
    try { posting = findJobPosting(JSON.parse(script[1])); if (posting) break; }
    catch { /* Ignore malformed third-party structured data. */ }
  }
  const organization = posting?.hiringOrganization as Record<string, unknown> | undefined;
  const title = String(posting?.title ?? metaContent(html, "og:title") ?? html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  const structuredDescription = htmlToText(String(posting?.description ?? ""));
  const visibleDescription = visibleJobDescription(html);
  const openGraphDescription = htmlToText(metaContent(html, "og:description"));
  const genericDescription = htmlToText(metaContent(html, "description"));
  const description = [structuredDescription, visibleDescription, openGraphDescription, genericDescription]
    .find((candidate) => candidate.length >= 80) ?? "";
  const siteName = htmlToText(metaContent(html, "og:site_name")).replace(/\.jobs?$/i, "");
  const hostnameCompany = new URL(sourceUrl).hostname.match(/(?:^|\.)(amazon|microsoft|google|netflix|meta)\./i)?.[1];
  const company = htmlToText(String(organization?.name ?? siteName ?? hostnameCompany ?? ""));
  return {
    company: company ? company.replace(/^./, (letter) => letter.toUpperCase()) : "",
    role: htmlToText(title).replace(/\s+(?:[|–-]\s+)?Job ID:.*$/i, "").replace(/\s+[|–-]\s+.*$/, ""),
    jobDescription: description.slice(0, 50_000),
  };
}
