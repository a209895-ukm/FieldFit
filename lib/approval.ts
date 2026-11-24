import { weightedScore, type Level } from "./client-config.ts";
export type ApprovalRules = {
  automatic: boolean;
  benchmark: number;
  minimum: number;
  spread: number;
};
export const APPROVAL_DEFAULTS: ApprovalRules = {
  automatic: false,
  benchmark: 75,
  minimum: 40,
  spread: 40,
};
export type ApprovalCandidate = {
  id: string;
  name: string;
  email: string;
  status: string;
  scores: number[];
  kind?: string;
  decision?: { decision: string };
  level?: Level | null;
  flags?: { id: string; severity: string }[];
};
export function approvalOutcome(c: ApprovalCandidate, rules: ApprovalRules) {
  if (c.kind === "employee" || c.status !== "Completed")
    return { route: "waiting", average: 0, reason: "Assessment not ready" };
  if (c.decision && c.decision.decision !== "Interview")
    return {
      route: "closed",
      average: 0,
      reason: "Hiring decision already recorded",
    };
  if (
    c.scores.length !== 6 ||
    c.scores.some((n) => !Number.isFinite(n) || n < 0 || n > 100)
  )
    return { route: "review", average: 0, reason: "Incomplete score profile" };
  // Weighted by the client's capability weights for the job level.
  const average = c.level
    ? weightedScore(c.scores, c.level)
    : c.scores.reduce((a, b) => a + b, 0) / 6;
  if (c.flags?.length)
    return {
      route: "review",
      average,
      reason: `Integrity flag: ${c.flags.length} answer${c.flags.length > 1 ? "s" : ""} scored as policy breach or fraud`,
    };
  const low = Math.min(...c.scores),
    high = Math.max(...c.scores);
  // Exceptions take precedence, even when the overall benchmark is met.
  if (low < rules.minimum || high - low > rules.spread)
    return {
      route: "review",
      average,
      reason: `Uneven profile: lowest ${low}, highest ${high}, gap ${high - low}`,
    };
  if (average >= rules.benchmark)
    return {
      route: "passed",
      average,
      reason: `Meets the ${rules.benchmark}/100 benchmark`,
    };
  return {
    route: "review",
    average,
    reason: "Below benchmark · HR review required",
  };
}
export type InterviewInvite = {
  candidateId: string;
  slots: string[];
  duration: number;
  host: string;
  location: string;
  source: "HR" | "Automatic";
  created: string;
  booked?: string;
  reason?: string;
};
function eventTimes(invite: InterviewInvite) {
  const start = new Date(invite.booked!),
    end = new Date(start.getTime() + invite.duration * 60000);
  return { start, end };
}
/** Opens a prepared event in Outlook on the web. Nothing is saved until the user saves it. */
export function outlookCalendarUrl(
  c: ApprovalCandidate,
  invite: InterviewInvite,
) {
  if (!invite.booked) return "";
  const { start, end } = eventTimes(invite);
  return (
    "https://outlook.office.com/calendar/0/deeplink/compose?" +
    new URLSearchParams({
      path: "/calendar/action/compose",
      rru: "addevent",
      subject: `FieldFit · Interview · ${c.name}`,
      startdt: start.toISOString(),
      enddt: end.toISOString(),
      body: "Interview with the FieldFit hiring team.",
      location: invite.location,
      to: `${invite.host};${c.email}`,
    })
  );
}
/** An .ics file that opens in the Outlook desktop app (or any calendar). */
export function calendarFile(c: ApprovalCandidate, invite: InterviewInvite) {
  const { start, end } = eventTimes(invite);
  const stamp = (date: Date) =>
    date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  const text = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FieldFit//Interview//EN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${c.id}-${stamp(start)}@fieldfit`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:FieldFit · Interview · ${c.name}`,
    `LOCATION:${invite.location}`,
    `ORGANIZER:mailto:${invite.host}`,
    `ATTENDEE;ROLE=REQ-PARTICIPANT:mailto:${c.email}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return new Blob([text], { type: "text/calendar;charset=utf-8" });
}
