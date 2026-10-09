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
type Text = Record<Lang, string>;
/** A chart or mini dashboard shown above a question. Labels are translated; numbers are shared. */
export type Visual =
  | {
      kind: "bar";
      title: Text;
      unit?: string;
      categories: Record<Lang, string[]>;
      series: { name: Text; values: number[] }[];
    }
  | {
      kind: "dashboard";
      title: Text;
      tiles: { label: Text; value: string }[];
      columns: Record<Lang, string[]>;
      rows: Record<Lang, string[][]>;
    };
export type Question = {
  id: string;
  cap: number;
  prompt: Text;
  options: Record<Lang, string[]>;
  points: number[];
  explanation: string;
  enabled: boolean;
  /** Bank revision. A stored copy with a lower revision is replaced by the bank version. */
  rev?: number;
  visual?: Visual;
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
  minutes: 20,
  version: 1,
};
/**
 * Brings a workspace's saved question bank up to date with this release:
 * items the bank has revised replace older stored copies (an administrator's
 * edits made after this release keep the newer revision), and untouched
 * default rules move to the new time limit.
 */
export function upgradeSettings(
  settings: { rules: Rules; questions: Question[] },
  bank: Question[],
) {
  const latest = new Map(bank.map((q) => [q.id, q]));
  const questions = settings.questions.map((q) => {
    const b = latest.get(q.id);
    return b && (q.rev ?? 1) < (b.rev ?? 1)
      ? { ...structuredClone(b), enabled: q.enabled }
      : q;
  });
  const rules =
    settings.rules.version === 1 && settings.rules.minutes === 40
      ? { ...settings.rules, minutes: DEFAULT_RULES.minutes }
      : settings.rules;
  return { ...settings, rules, questions };
}
function shuffled<T>(items: T[], random: () => number) {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
/** Reorders a question's answers; options and points move together in every language. */
export function shuffleOptions(q: Question, random: () => number): Question {
  const order = shuffled([0, 1, 2, 3], random);
  return {
    ...q,
    options: {
      en: order.map((i) => q.options.en[i]),
      ms: order.map((i) => q.options.ms[i]),
      zh: order.map((i) => q.options.zh[i]),
    },
    points: order.map((i) => q.points[i]),
  };
}
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
  const picked = CAPS.flatMap((_, cap) =>
    shuffled(
      bank.filter((q) => q.cap === cap && q.enabled),
      random,
    ).slice(0, 2),
  );
  // Each invitation gets its own question order and answer order.
  return shuffled(picked, random).map((q) => shuffleOptions(q, random));
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
