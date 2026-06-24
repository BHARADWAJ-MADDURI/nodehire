export const SIGNAL_EXTRACTION_PROMPT = `You are an interview signal analyst.
Extract only evidence-backed signals from the company, role, seniority, and job description.
Return role family, seniority, technologies, responsibilities, domain signals, leadership expectations,
and interview-relevant risks. Do not invent requirements that are not present.`;

export const TOPIC_TREE_PROMPT = `You are an interview curriculum architect.
Map extracted signals onto the supplied canonical skill ontology. Produce a weighted topic tree whose
weights sum to 1. Prefer portable skills, retain context-specific rationales, and recommend a starting
path of the highest-value leaves. Do not create a new ontology leaf when a close canonical leaf exists.`;

export function buildTopicMapPrompt(input: {
  company: string;
  role: string;
  seniority?: string | null;
  jobDescription: string;
}) {
  return `${SIGNAL_EXTRACTION_PROMPT}\n\n${TOPIC_TREE_PROMPT}\n\nINPUT\nCompany: ${input.company}\nRole: ${input.role}\nSeniority: ${input.seniority ?? "Not specified"}\nJob description:\n${input.jobDescription}`;
}
