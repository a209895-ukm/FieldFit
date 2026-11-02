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
  const average = c.scores.reduce((a, b) => a + b, 0) / 6;
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
export function googleCalendarUrl(
  c: ApprovalCandidate,
  invite: InterviewInvite,
) {
  if (!invite.booked) return "";
  const start = new Date(invite.booked),
    end = new Date(start.getTime() + invite.duration * 60000);
  const stamp = (date: Date) =>
    date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  return (
    "https://calendar.google.com/calendar/render?" +
    new URLSearchParams({
      action: "TEMPLATE",
      text: `FieldFit · Second interview · ${c.name}`,
      dates: `${stamp(start)}/${stamp(end)}`,
      details: "Second interview with the FieldFit hiring team.",
      location: invite.location,
      add: `${invite.host},${c.email}`,
    })
  );
}
