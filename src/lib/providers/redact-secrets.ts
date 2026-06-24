export function redactSecrets(value: unknown, secrets: string[] = []) {
  let text = value instanceof Error ? value.message : String(value);
  for (const secret of secrets) if (secret) text = text.split(secret).join("[REDACTED]");
  return text
    .replace(/sk-[A-Za-z0-9_-]{12,}/g, "[REDACTED]")
    .replace(/AIza[A-Za-z0-9_-]{20,}/g, "[REDACTED]")
    .replace(/(?:api[_-]?key|authorization)["'\s:=]+[^\s,"']+/gi, "$1=[REDACTED]");
}
