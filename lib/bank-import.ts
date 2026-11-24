import type { Question } from "./assessment";

const CAP_PREFIX = ["NUM", "LOG", "SJT", "PS", "SLR", "DDL"];
const CAP_MATCH = ["numerical", "logical", "situational", "problem", "self", "digital"];
const FORMATS: Record<string, Question["format"]> = {
  "single correct answer": "single",
  "weighted judgement": "weighted",
  "open-ended (written / spoken)": "open",
};

/**
 * Reads rows laid out like tab "4. Your Questions" of the FieldFit Question Bank Input Form:
 * Capability | Job level | Format | Real? | Scenario | Question | Option A | Score A | ... | Option D | Score D |
 * Open-ended: what a strong answer must include | Related sample file | Notes.
 * Columns are found by their header text, so an "Item ID" column before them is optional.
 */
export function questionsFromRows(rows: unknown[][], existing: Question[]) {
  const text = (v: unknown) => (v == null ? "" : String(v).trim());
  const headerIndex = rows.findIndex((r) =>
    r.some((c) => text(c).toLowerCase() === "capability"),
  );
  if (headerIndex < 0)
    throw Error(
      'No "Capability" header found. Use the "4. Your Questions" layout from the Question Bank Input Form.',
    );
  const header = rows[headerIndex].map((c) => text(c).toLowerCase());
  const col = (start: string) => header.findIndex((h) => h.startsWith(start));
  const at = {
    cap: col("capability"),
    level: col("job level"),
    format: col("format"),
    scenario: col("scenario"),
    question: col("question to"),
    rubric: col("open-ended"),
    source: col("related sample"),
    notes: col("notes"),
    options: ["a", "b", "c", "d"].map((l) => [col("option " + l), col("score " + l)]),
  };
  if ([at.cap, at.level, at.format, at.question].some((i) => i < 0))
    throw Error("Missing columns: Capability, Job level, Format and Question to the candidate are required.");
  const counters = new Map<string, number>();
  for (const q of existing) {
    const m = q.id.match(/^([A-Z]+-[A-Z]+-[EJS])(\d+)$/);
    if (m) counters.set(m[1], Math.max(counters.get(m[1]) ?? 0, Number(m[2])));
  }
  const questions: Question[] = [];
  const skipped: string[] = [];
  rows.slice(headerIndex + 1).forEach((r, n) => {
    const row = n + headerIndex + 2;
    const capText = text(r[at.cap]).toLowerCase();
    const prompt = text(r[at.question]);
    if (!capText || !prompt) return;
    if (r.some((c) => text(c).toUpperCase() === "EXAMPLE")) return;
    const cap = CAP_MATCH.findIndex((m) => capText.startsWith(m));
    const level = text(r[at.level]) as Question["level"];
    const format = FORMATS[text(r[at.format]).toLowerCase()];
    if (cap < 0 || !["Entry", "Junior", "Senior"].includes(level ?? "") || !format) {
      skipped.push(`Row ${row}: check capability, job level and format`);
      return;
    }
    const options: string[] = [];
    const points: number[] = [];
    if (format !== "open") {
      for (const [o, sc] of at.options) {
        const option = text(r[o]);
        const score = Number(r[sc]);
        if (option && Number.isFinite(score)) {
          options.push(option);
          points.push(Math.round(score * 100));
        }
      }
      if (options.length < 2 || points.some((p) => p < -200 || p > 100)) {
        skipped.push(`Row ${row}: needs 2-4 options with scores between -2 and 1`);
        return;
      }
    }
    const key = `TRB-${CAP_PREFIX[cap]}-${level![0]}`;
    const next = (counters.get(key) ?? 0) + 1;
    counters.set(key, next);
    const scenario = at.scenario >= 0 ? text(r[at.scenario]) : "";
    const full = scenario ? scenario + "\n\n" + prompt : prompt;
    const rubric = at.rubric >= 0 ? text(r[at.rubric]) : "";
    questions.push({
      id: key + next,
      cap,
      prompt: { en: full, ms: full, zh: full },
      options: { en: options, ms: options, zh: options },
      points,
      explanation:
        format === "open"
          ? "Rubric: " + rubric
          : format === "single"
            ? "Correct: " + options[points.indexOf(Math.max(...points))] + "."
            : "Weighted judgement: " +
              points.map((p, i) => `${"ABCD"[i]} ${(p / 100).toFixed(1)}`).join("; ") +
              ".",
      enabled: true,
      level,
      format,
      translated: false,
      source: at.source >= 0 ? text(r[at.source]) || null : null,
      rubric: rubric || null,
      client: true,
    });
  });
  return { questions, skipped };
}
