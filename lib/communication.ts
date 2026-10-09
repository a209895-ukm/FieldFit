import type { Lang } from "./assessment";

type Text = Record<Lang, string>;

/** One listening clip and its comprehension questions (10 marks each, 30 in total). */
export type Listening = {
  id: string;
  /** Text read aloud. Until recorded audio is supplied, the browser's speech synthesis reads it. */
  script: Text;
  /** Optional recorded audio per language (URL). Takes priority over speech synthesis. */
  audio?: Partial<Text>;
  maxPlays: number;
  questions: {
    id: string;
    prompt: Text;
    options: Record<Lang, string[]>;
    points: number[];
  }[];
};
export type Speaking = { customer: Text };
export type DeliveryMetrics = {
  durationSec: number;
  units: number;
  /** Words per minute (English, BM) or characters per minute (Mandarin); null without a transcript. */
  pace: number | null;
  longPauses: number;
  attempts: number;
  transcribed: boolean;
};
export type Communication = {
  mode: "voice" | "typed";
  listening: { answers: Record<string, number>; plays: number };
  metrics?: DeliveryMetrics;
  audio?: { id: string; type: string };
};
export type DeliveryReview = { clarity: number; pace: number; fluency: number };

/** Candidate-facing copy of a listening clip: no answer points. */
export function safeListening(l: Listening) {
  return {
    ...l,
    questions: l.questions.map(({ points, ...q }) => q),
  };
}

const PACE_BANDS: Record<Lang, { low: number; high: number; step: number }> = {
  en: { low: 110, high: 170, step: 10 },
  ms: { low: 110, high: 170, step: 10 },
  zh: { low: 170, high: 280, step: 15 },
};
/** Words (English, BM) or characters (Mandarin) in a transcript. */
export function countUnits(text: string, lang: Lang) {
  if (lang === "zh") {
    const han = text.match(/[㐀-鿿]/g)?.length ?? 0;
    const words =
      text
        .replace(/[㐀-鿿]/g, " ")
        .split(/\s+/)
        .filter((w) => /[\p{L}\p{N}]/u.test(w)).length ?? 0;
    return han + words;
  }
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}
/** Suggested pace marks out of 10. Full marks inside a comfortable band; calibrate the band against staff benchmarks. */
export function paceMarks(pace: number | null, lang: Lang) {
  if (pace === null) return null;
  const b = PACE_BANDS[lang];
  const distance =
    pace < b.low ? b.low - pace : pace > b.high ? pace - b.high : 0;
  return Math.max(0, 10 - Math.ceil(distance / b.step));
}
/** Suggested fluency marks out of 10: 2 marks off per silence over 3 seconds; a very short reply is capped. */
export function fluencyMarks(longPauses: number, durationSec: number) {
  const marks = Math.max(0, 10 - 2 * longPauses);
  return durationSec < 20 ? Math.min(marks, 5) : marks;
}
export const PACE_NOTE: Record<Lang, string> = {
  en: "110–170 words per minute",
  ms: "110–170 words per minute",
  zh: "170–280 characters per minute",
};

export type CommunicationScore = {
  mode: "voice" | "typed";
  listening: number | null;
  content: number | null;
  delivery: number | null;
  total: number;
  max: number;
  pending: boolean;
  suggested?: { pace: number | null; fluency: number };
};
/** Customer communication out of 100: listening 30, content 40, delivery 30 (delivery not applicable for typed replies). */
export function communicationScore(c: any): CommunicationScore | null {
  const comm: Communication | undefined = c.communication;
  const listening: Listening | undefined = c.assessment?.listening;
  if (!comm && !c.review && !listening) return null;
  const mode = comm?.mode ?? "typed";
  const lang = (c.language ?? "en") as Lang;
  const listen =
    listening && comm
      ? Math.round(
          listening.questions.reduce(
            (sum, q) =>
              sum + (q.points[comm.listening.answers[q.id]] ?? 0) / 10,
            0,
          ),
        )
      : null;
  const content = c.review
    ? Math.round(
        (c.review.ratings.reduce((a: number, b: number) => a + b, 0) / 16) * 40,
      )
    : null;
  const suggested =
    mode === "voice" && comm?.metrics
      ? {
          pace: paceMarks(comm.metrics.pace, lang),
          fluency: fluencyMarks(
            comm.metrics.longPauses,
            comm.metrics.durationSec,
          ),
        }
      : undefined;
  const d: DeliveryReview | undefined = c.review?.delivery;
  const delivery =
    mode === "voice" && d
      ? Math.round(d.clarity * 2.5) + d.pace + d.fluency
      : null;
  const max = (listening ? 30 : 0) + 40 + (mode === "voice" ? 30 : 0);
  return {
    mode,
    listening: listen,
    content,
    delivery,
    total: (listen ?? 0) + (content ?? 0) + (delivery ?? 0),
    max,
    pending: content === null || (mode === "voice" && delivery === null),
    suggested,
  };
}

/** CSV columns shared by the server and the demo exports. */
export const COMMUNICATION_COLUMNS = [
  "Response mode",
  "Listening /30",
  "Reply content /40",
  "Delivery /30",
  "Communication total",
];
export function communicationCells(c: any) {
  const s = communicationScore(c);
  if (!s) return ["", "", "", "", ""];
  return [
    s.mode === "voice" ? "Voice" : "Typed",
    s.listening ?? "",
    s.content ?? "Pending",
    s.mode === "typed" ? "n/a" : (s.delivery ?? "Pending"),
    s.pending ? "Pending" : `${s.total}/${s.max}`,
  ];
}
