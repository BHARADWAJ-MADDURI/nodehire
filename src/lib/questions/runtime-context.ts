import type { RuntimeContext } from "./types";

export function injectRuntimeContext(input: {
  company: string;
  role: string;
  ontologyName: string;
  candidateBackground?: string | null;
  interviewRound?: string;
}): RuntimeContext {
  return {
    company: input.company,
    role: input.role,
    framing: `Frame your answer for a ${input.interviewRound ? `${input.interviewRound.replace("-", " ")} round of a ` : ""}${input.role} interview at ${input.company}, emphasizing ${input.ontologyName}.${input.candidateBackground ? " Use a truthful example from the candidate background when relevant." : ""}`,
  };
}
