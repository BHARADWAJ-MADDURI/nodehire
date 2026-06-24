import { ONTOLOGY, type OntologySkill } from "./ontology";

export type TopicLeaf = {
  id: string;
  name: string;
  domain: string;
  description: string;
  weight: number;
  rationale: string;
  selected: boolean;
};

export type TopicBranch = { domain: string; weight: number; topics: TopicLeaf[] };

export type TopicAnalysis = {
  roleFamily: "software" | "data" | "quality" | "business";
  seniority: string;
  signals: string[];
  branches: TopicBranch[];
  recommendedPath: string[];
};

function roleFamily(role: string): TopicAnalysis["roleFamily"] {
  const value = role.toLowerCase();
  if (/sdet|qa|quality|test|automation/.test(value)) return "quality";
  if (/data engineer|analytics engineer|etl|data platform/.test(value)) return "data";
  if (/business analyst|\bba\b|product analyst|systems analyst/.test(value)) return "business";
  return "software";
}

function evidence(skill: OntologySkill, haystack: string) {
  return skill.keywords.filter((keyword) => haystack.includes(keyword));
}

export function analyzePrepContext(input: {
  company: string;
  role: string;
  seniority?: string | null;
  jobDescription: string;
}): TopicAnalysis {
  const family = roleFamily(input.role);
  const haystack = `${input.company} ${input.role} ${input.seniority ?? ""} ${input.jobDescription}`.toLowerCase();
  const inferred = /principal|staff|lead|manager|architect|senior/.exec(haystack)?.[0];
  const seniority = input.seniority || inferred || "Not specified";

  const scored = ONTOLOGY.map((skill) => {
    const matches = evidence(skill, haystack);
    let score = matches.length * 1.5;
    if (skill.roleFamilies.includes(family)) score += skill.baseWeight * 2;
    if (/senior|lead|principal|staff|manager|architect/.test(haystack) && skill.id === "behavioral-leadership") score += 2;
    return { skill, matches, score };
  })
    .filter((item) => item.score > 0.65)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const fallback = ONTOLOGY.filter((skill) => skill.roleFamilies.includes(family)).slice(0, 6);
  const candidates = scored.length >= 5
    ? scored
    : fallback.map((skill) => ({ skill, matches: evidence(skill, haystack), score: skill.baseWeight * 2 }));
  const total = candidates.reduce((sum, item) => sum + item.score, 0);
  const leaves = candidates.map(({ skill, matches, score }) => ({
    id: skill.id,
    name: skill.name,
    domain: skill.domain,
    description: skill.description,
    weight: Number((score / total).toFixed(4)),
    rationale: matches.length
      ? `Matched ${matches.slice(0, 3).join(", ")} in the target context.`
      : `Recommended for ${family} interview readiness.`,
    selected: true,
  }));

  const branches = Array.from(new Set(leaves.map((leaf) => leaf.domain))).map((domain) => {
    const topics = leaves.filter((leaf) => leaf.domain === domain);
    return {
      domain,
      weight: Number(topics.reduce((sum, topic) => sum + topic.weight, 0).toFixed(4)),
      topics,
    };
  }).sort((a, b) => b.weight - a.weight);

  const signals = Array.from(new Set(scored.flatMap((item) => item.matches))).slice(0, 10);
  return {
    roleFamily: family,
    seniority: seniority.replace(/^./, (value) => value.toUpperCase()),
    signals,
    branches,
    recommendedPath: [...leaves].sort((a, b) => b.weight - a.weight).slice(0, 4).map((leaf) => leaf.id),
  };
}
