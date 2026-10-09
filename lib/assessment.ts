export type Lang = "en" | "ms" | "zh";
export const LANGS = { en: "English", ms: "Bahasa Malaysia", zh: "中文" };
export const CAPS = [
  "Numerical & analytical",
  "Logical thinking",
  "Situational judgement",
  "Problem-solving",
  "Self-leadership",
  "Digital & data literacy",
];
export type Question = {
  id: string;
  cap: number;
  prompt: Record<Lang, string>;
  options: Record<Lang, string[]>;
  points: number[];
  explanation: string;
  enabled: boolean;
};
export type Rules = {
  proficient: number;
  strong: number;
  core: number[];
  minutes: number;
  version: number;
};
export const DEFAULT_RULES: Rules = {
  proficient: 60,
  strong: 80,
  core: [2, 4],
  minutes: 40,
  version: 1,
};
export const ROLEPLAY: Record<Lang, string> = {
  en: "Customer: “Your price is higher, and my last delivery was late. Why should I order from you again?” Write your reply, including the questions you would ask and a practical next step. Do not promise an unapproved discount or delivery date.",
  ms: "Pelanggan: “Harga anda lebih tinggi, dan penghantaran terakhir lewat. Mengapa saya patut membeli lagi?” Tulis respons anda, termasuk soalan dan langkah seterusnya. Jangan janji diskaun atau tarikh penghantaran tanpa kelulusan.",
  zh: "顾客：“你的价格更高，上次交货也迟了。为什么我还应该向你下单？”请写出你的回应，包括你会提出的问题和可行的下一步。不要承诺未经批准的折扣或交货日期。",
};
export const RUBRIC = [
  "Acknowledges the customer’s concern",
  "Clarifies needs and verifies the facts",
  "Offers an honest, feasible solution",
  "Agrees a clear follow-up",
];
export function chooseQuestions(
  bank: Question[],
  random = () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296,
) {
  return CAPS.flatMap((_, cap) => {
    const pool = bank.filter((q) => q.cap === cap && q.enabled);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 2);
  });
}
export function scoreAnswers(
  questions: Question[],
  answers: Record<string, number>,
) {
  return CAPS.map((_, cap) => {
    const qs = questions.filter((q) => q.cap === cap);
    return qs.length
      ? Math.round(
          qs.reduce((sum, q) => sum + (q.points[answers[q.id]] ?? 0), 0) /
            qs.length,
        )
      : 0;
  });
}
export function profile(scores: number[], rules: Rules) {
  return scores.map((score, cap) => ({
    cap,
    score,
    level:
      score >= rules.strong
        ? "Strong"
        : score >= rules.proficient
          ? "Proficient"
          : "Developing",
    type:
      score >= rules.proficient
        ? "Strength"
        : rules.core.includes(cap)
          ? "Core risk"
          : "Development gap",
  }));
}
export const PROBES = [
  "Walk me through a discount or commission calculation you checked.",
  "Explain how you checked a decision when several rules applied.",
  "Tell me how you recovered trust with a dissatisfied customer.",
  "Describe a sales problem where key information was missing.",
  "Tell me about a week you were behind target and nobody was checking on you.",
  "Show how you would use a CRM dashboard to plan tomorrow.",
];
export const TRAINING = [
  "Practise percentages, margins and chart reading.",
  "Practise rule-based prioritisation and explain the reasoning.",
  "Coach active listening and complaint resolution.",
  "Use a structured problem definition and option review.",
  "Build a daily plan, feedback routine and follow-up tracker.",
  "Practise CRM hygiene, filters and conversion analysis.",
];
export function csvCell(value: unknown) {
  let s = String(value ?? "");
  if (/^[\s]*[=+@\-]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
