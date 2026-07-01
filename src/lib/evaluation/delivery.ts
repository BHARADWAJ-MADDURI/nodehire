export type DeliveryAnalysis = {
  wordCount: number;
  durationSeconds: number | null;
  estimatedWordsPerMinute: number | null;
  fillerWordCount: number;
  fillerWords: string[];
  star: { situation: boolean; task: boolean; action: boolean; result: boolean };
};

export function analyzeDelivery(answer: string, durationSeconds?: number): DeliveryAnalysis {
  const words = answer.trim().split(/\s+/).filter(Boolean);
  const fillerMatches = answer.toLowerCase().match(/\b(?:um+|uh+|like|basically|actually|you know|sort of|kind of)\b/g) ?? [];
  const duration = durationSeconds && durationSeconds > 0 ? Math.round(durationSeconds) : null;
  return {
    wordCount: words.length,
    durationSeconds: duration,
    estimatedWordsPerMinute: duration ? Math.round(words.length / duration * 60) : null,
    fillerWordCount: fillerMatches.length,
    fillerWords: Array.from(new Set(fillerMatches)),
    star: {
      situation: /\b(?:situation|context|when|at the time|project|team)\b/i.test(answer),
      task: /\b(?:task|goal|objective|needed to|responsible for|challenge)\b/i.test(answer),
      action: /\b(?:action|i (?:created|built|led|decided|implemented|changed|worked|analyzed|proposed)|my role)\b/i.test(answer),
      result: /\b(?:result|outcome|impact|improved|reduced|increased|saved|grew|\d+%)\b/i.test(answer),
    },
  };
}
