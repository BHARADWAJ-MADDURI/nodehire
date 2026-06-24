export function computeReadiness(
  mappings: Array<{ ontology_leaf_id: string; weight: number }>,
  mastery: Map<string, number>,
) {
  const totalWeight = mappings.reduce((sum, item) => sum + Number(item.weight), 0) || 1;
  const portable = mappings.reduce((sum, item) => sum + (mastery.get(item.ontology_leaf_id) ?? 0) * Number(item.weight), 0) / totalWeight;
  const role = Math.round(portable);
  const leadership = mastery.get("behavioral-leadership") ?? portable;
  return {
    role,
    jobDescription: Math.round(portable * 0.9 + leadership * 0.1),
    company: Math.round(portable * 0.75 + leadership * 0.25),
  };
}
