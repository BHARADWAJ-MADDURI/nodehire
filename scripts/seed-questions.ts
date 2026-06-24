import "dotenv/config";
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { readFile, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { z } from "zod";
import { ONTOLOGY } from "../src/lib/topic-map/ontology";

loadEnv({ path: resolve(process.cwd(), ".env.local"), override: false, quiet: true });
type RawQuestion = { text: string; sourceTag?: string };
type Reason = "low confidence" | "no match" | "duplicate" | "cap reached" | "classification error";
type Discarded = RawQuestion & { reason: Reason; detail?: string };

const resultSchema = z.object({
  matchedLeafId: z.string().nullable(),
  confidence: z.enum(["high", "medium", "low"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  idealAnswer: z.string().min(20),
  rubric: z.object({ correctness: z.string(), depth: z.string(), communication: z.string(), domainKnowledge: z.string(), clarity: z.string() }),
});

function parseCsv(raw: string): RawQuestion[] {
  const rows = raw.split(/\r?\n/).filter(Boolean);
  const header = (rows.shift() ?? "").split(",").map((value) => value.trim().toLowerCase());
  const textAt = header.indexOf("text");
  const sourceAt = header.indexOf("sourcetag");
  if (textAt < 0) throw new Error("CSV requires a text column.");
  const clean = (value = "") => value.trim().replace(/^"|"$/g, "").replace(/""/g, "");
  return rows.map((row) => {
    const cells = row.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g)?.map((cell) => cell.replace(/^,/, "")) ?? [];
    return { text: clean(cells[textAt]), sourceTag: sourceAt >= 0 ? clean(cells[sourceAt]) : undefined };
  }).filter((item) => item.text);
}

async function readInput(path: string) {
  const raw = await readFile(path, "utf8");
  if (extname(path).toLowerCase() === ".csv") return parseCsv(raw);
  return z.array(z.object({ text: z.string().min(1), sourceTag: z.string().optional() })).parse(JSON.parse(raw));
}

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");
const sleep = (milliseconds: number) => new Promise((done) => setTimeout(done, milliseconds));

async function classify(question: RawQuestion, apiKey: string) {
  const leaves = ONTOLOGY.map((leaf) => `${leaf.id}: ${leaf.parentId ? `${leaf.parentId} > ` : ""}${leaf.name}`).join("\n");
  const prompt = `Classify this open-source interview question into exactly one NodeHire ontology SUB-LEAF. Do not force a weak match. Return JSON only: matchedLeafId (an ID below or null), confidence (high|medium|low), difficulty (easy|medium|hard), idealAnswer, rubric {correctness,depth,communication,domainKnowledge,clarity}.\n\nONTOLOGY LEAVES:\n${leaves}\n\nQUESTION:\n${question.text}`;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || "gemini-2.5-flash-lite"}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0 } }),
  });
  if (!response.ok) throw new Error(`Gemini classification failed with HTTP ${response.status}.`);
  const body = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = body.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no classification.");
  const result = resultSchema.parse(JSON.parse(text.replace(/^```json\s*|\s*```$/g, "")));
  return result.matchedLeafId && !ONTOLOGY.some((leaf) => leaf.id === result.matchedLeafId) ? { ...result, matchedLeafId: null } : result;
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) throw new Error("Usage: pnpm seed:questions <questions.json|questions.csv>");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!url || !serviceKey || !geminiKey) throw new Error("NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and GEMINI_API_KEY are required in .env.local.");
  const questions = await readInput(resolve(inputPath));
  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: existing, error } = await db.from("question_bank").select("ontology_leaf_id,question_text").eq("mode", "drill");
  if (error) throw error;
  const seen = new Set((existing ?? []).map((item) => `${item.ontology_leaf_id}:${normalize(item.question_text)}`));
  const counts = new Map<string, number>();
  for (const item of existing ?? []) counts.set(item.ontology_leaf_id, (counts.get(item.ontology_leaf_id) ?? 0) + 1);
  const inserted = new Map<string, number>();
  const discarded: Discarded[] = [];
  const delay = Number(process.env.SEED_QUESTION_DELAY_MS || 1500);
  const cap = Number(process.env.SEED_QUESTION_LEAF_CAP || 15);

  for (const [index, question] of questions.entries()) {
    try {
      const result = await classify(question, geminiKey);
      if (!result.matchedLeafId) discarded.push({ ...question, reason: "no match" });
      else if (result.confidence === "low") discarded.push({ ...question, reason: "low confidence" });
      else if (seen.has(`${result.matchedLeafId}:${normalize(question.text)}`)) discarded.push({ ...question, reason: "duplicate" });
      else if ((counts.get(result.matchedLeafId) ?? 0) >= cap) discarded.push({ ...question, reason: "cap reached" });
      else {
        const { error: insertError } = await db.from("question_bank").insert({ ontology_leaf_id: result.matchedLeafId, mode: "drill", difficulty: result.difficulty, question_text: question.text.trim(), answer_type: result.matchedLeafId === "data-structures" ? "code" : result.matchedLeafId === "system-design" ? "diagram" : "text", ideal_answer: result.idealAnswer, evaluation_rubric: result.rubric, follow_up_hints: [], source: `open-source:${(question.sourceTag || "unknown").slice(0, 16)}` });
        if (insertError?.code === "23505") discarded.push({ ...question, reason: "duplicate" });
        else if (insertError) throw insertError;
        else { seen.add(`${result.matchedLeafId}:${normalize(question.text)}`); counts.set(result.matchedLeafId, (counts.get(result.matchedLeafId) ?? 0) + 1); inserted.set(result.matchedLeafId, (inserted.get(result.matchedLeafId) ?? 0) + 1); }
      }
    } catch (classificationError) {
      discarded.push({ ...question, reason: "classification error", detail: classificationError instanceof Error ? classificationError.message : "Unknown error" });
    }
    if (index < questions.length - 1) await sleep(delay);
  }
  const output = resolve(process.cwd(), "scripts/seed-discarded.json");
  await writeFile(output, `${JSON.stringify(discarded, null, 2)}\n`, "utf8");
  const reasons = discarded.reduce<Record<string, number>>((summary, item) => ({ ...summary, [item.reason]: (summary[item.reason] ?? 0) + 1 }), {});
  console.log(JSON.stringify({ processed: questions.length, inserted: Object.fromEntries([...inserted].sort()), insertedTotal: [...inserted.values()].reduce((sum, count) => sum + count, 0), discarded: reasons, discardedTotal: discarded.length, discardedFile: output }, null, 2));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
