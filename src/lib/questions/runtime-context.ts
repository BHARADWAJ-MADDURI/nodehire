import type { RuntimeContext } from "./types";

export function injectRuntimeContext(input: {
  company: string;
  role: string;
  ontologyName: string;
}): RuntimeContext {
  return {
    company: input.company,
    role: input.role,
    framing: `Frame your answer for a ${input.role} interview at ${input.company}, emphasizing ${input.ontologyName}.`,
  };
}
