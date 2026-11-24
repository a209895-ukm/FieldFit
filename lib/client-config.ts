/**
 * Client configuration for the TCP Red Bull Malaysia pilot (formerly Yee Lee Marketing).
 * Source: FieldFit Question Bank Input Form (Final) returned 18 Nov 2026,
 * and the Week 3 client meeting (18 Nov 2026).
 */
export const BRAND = {
  company: "TCP Red Bull Malaysia",
  short: "TCP Red Bull",
  // Official logo and colour codes are pending from the client's corporate team.
  logo: null as string | null,
  pending: "Official logo and brand colours pending from the client",
};

export type Level = "Entry" | "Junior" | "Senior";
export const LEVELS: Level[] = ["Entry", "Junior", "Senior"];

export type JobRole = {
  id: string;
  title: string;
  level: Level;
  channel: string;
};
export const JOB_ROLES: JobRole[] = [
  { id: "dsr", title: "Sales Representative (DSR) - GT", level: "Entry", channel: "General trade via Sub-distributors" },
  { id: "me", title: "Merchandiser (ME) - MT / mini-market", level: "Entry", channel: "Modern trade mini-market and convenience chains" },
  { id: "se", title: "Sales Executive (SE) - GT", level: "Junior", channel: "General trade via Sub-distributors" },
  { id: "rts", title: "Roving Team Supervisor - MT", level: "Senior", channel: "Modern trade and RTM routes" },
  { id: "asm", title: "Assistant Sales Manager (ASM) - GT", level: "Senior", channel: "General trade, Perfect Store programme" },
  { id: "sm", title: "Sales Manager (SM) - GT", level: "Senior", channel: "General trade, Sub-D network" },
];
export const roleById = (id?: string | null) =>
  JOB_ROLES.find((r) => r.id === id) ?? JOB_ROLES[0];

/**
 * Assessment length by job level, as set by the client (Step 1, section C).
 * perCap = multiple-choice items per capability (NUM, LOG, SJT, PS, SLR, DDL).
 */
export const BLUEPRINTS: Record<
  Level,
  { minutes: number; perCap: number[]; open: number; spoken: number; note: string }
> = {
  Entry: { minutes: 30, perCap: [4, 4, 4, 4, 4, 4], open: 0, spoken: 1, note: "~30 min · 24 questions (4 per capability) + 1 spoken task" },
  Junior: { minutes: 40, perCap: [5, 5, 5, 5, 5, 5], open: 0, spoken: 2, note: "~40 min · 30 questions (5 per capability) + 2 spoken tasks (prototype runs 1 for now)" },
  Senior: { minutes: 50, perCap: [5, 4, 4, 5, 3, 5], open: 3, spoken: 1, note: "~50 min · 26 questions + 3 open-ended + 1 spoken task" },
};

/** Capability weights per job level (Step 1, section B). Each column sums to 1. */
export const WEIGHTS: Record<Level, number[]> = {
  Entry: [0.15, 0.1, 0.25, 0.1, 0.25, 0.15],
  Junior: [0.2, 0.1, 0.15, 0.15, 0.2, 0.2],
  Senior: [0.2, 0.15, 0.15, 0.2, 0.1, 0.2],
};

export function weightedScore(scores: number[], level?: Level | null) {
  if (scores.length !== 6) return 0;
  const w = WEIGHTS[level ?? "Junior"] ?? WEIGHTS.Junior;
  return scores.reduce((sum, s, i) => sum + s * w[i], 0);
}

/** Per-question time limits in seconds (client: 60-90 s judgement, 2-3 min calculations, 6-8 min open-ended). */
export function questionSeconds(q: { cap: number; format?: string }) {
  if (q.format === "open") return 480;
  if (q.cap === 0 || q.cap === 5 || q.format === "single") return 150;
  return 90;
}

/** Anti-cheating: warnings shown before the assessment is submitted automatically. */
export const DEFAULT_MAX_WARNINGS = 2;

/** Hosting decision is pending with the client's IT team (Week 4 proposal). */
export const STAFF_ROLES = {
  admin: { label: "Master Admin", note: "Highest authority: user accounts, settings and all data" },
  hr: { label: "HR", note: "Invitations, hiring rules, question bank and all candidates" },
  manager: { label: "Hiring Manager", note: "Only assigned candidates: review results and record interview decisions" },
} as const;
export type StaffRole = keyof typeof STAFF_ROLES;
