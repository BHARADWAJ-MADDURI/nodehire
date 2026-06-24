import { describe, expect, it } from "vitest";
import { redactSecrets } from "./redact-secrets";

describe("redactSecrets", () => {
  it("removes literal and recognizable API keys", () => {
    const secret = "sk-example_secret_123456789";
    const output = redactSecrets(new Error(`Provider rejected ${secret}`), [secret]);
    expect(output).not.toContain(secret);
    expect(output).toContain("[REDACTED]");
  });
});
