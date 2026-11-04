import {
  APPROVAL_DEFAULTS,
  approvalOutcome,
  type ApprovalCandidate,
  type ApprovalRules,
  type InterviewInvite,
} from "./approval.ts";
export type JourneyCandidate = ApprovalCandidate & {
  accessToken?: string;
  language?: string;
  journeyPreview?: string;
};
export type JourneyInvite = InterviewInvite & {
  confirmedAt?: string;
  attendedAt?: string;
  availabilityRequested?: string;
};
export type JourneyState = {
  rules: ApprovalRules;
  invites: Record<string, JourneyInvite>;
  reviews: Record<
    string,
    { action: "hold" | "decline"; reason: string; at: string }
  >;
  decisions: Record<
    string,
    { decision: "Hire" | "Hold" | "Reject"; reason: string; at: string }
  >;
  host: string;
  location: string;
  duration: number;
  slots: string[];
  calendarPreview: boolean;
};
export function emptyJourney(): JourneyState {
  return {
    rules: { ...APPROVAL_DEFAULTS },
    invites: {},
    reviews: {},
    decisions: {},
    host: "",
    location: "Online interview",
    duration: 30,
    slots: [],
    calendarPreview: false,
  };
}
export function normalizeJourney(value: Partial<JourneyState>): JourneyState {
  return {
    ...emptyJourney(),
    ...value,
    rules: { ...APPROVAL_DEFAULTS, ...value.rules },
    reviews: value.reviews ?? {},
    decisions: value.decisions ?? {},
  };
}
export function hasAvailability(s: JourneyState, now = Date.now()) {
  return (
    /^\S+@\S+\.\S+$/.test(s.host) &&
    s.slots.some((slot) => Date.parse(slot) > now)
  );
}
export function syncAutomatic(
  s: JourneyState,
  candidates: JourneyCandidate[],
  now = Date.now(),
): JourneyState {
  if (!s.rules.automatic || !hasAvailability(s, now)) return s;
  const next = { ...s, invites: { ...s.invites } };
  let changed = false;
  for (const c of candidates)
    if (
      !s.invites[c.id] &&
      !s.reviews[c.id] &&
      !s.decisions[c.id] &&
      approvalOutcome(c, s.rules).route === "passed"
    ) {
      next.invites[c.id] = invitation(s, c.id, "Automatic", "", now);
      changed = true;
    }
  return changed ? next : s;
}
export function invitation(
  s: JourneyState,
  id: string,
  source: "HR" | "Automatic",
  reason = "",
  now = Date.now(),
): JourneyInvite {
  if (!hasAvailability(s, now))
    throw Error(
      "Add your HR email and at least one future interview slot in Set the rules.",
    );
  return {
    candidateId: id,
    slots: s.slots.filter((v) => Date.parse(v) > now),
    duration: s.duration,
    host: s.host,
    location: s.location,
    source,
    created: new Date(now).toISOString(),
    reason,
  };
}
export function slotAvailable(
  s: JourneyState,
  id: string,
  slot: string,
  now = Date.now(),
) {
  const invite = s.invites[id];
  if (
    !invite ||
    !invite.slots.includes(slot) ||
    Date.parse(slot) <= now ||
    !Number.isFinite(Date.parse(slot))
  )
    return false;
  return !Object.values(s.invites).some(
    (i) =>
      i.candidateId !== id &&
      i.booked &&
      Date.parse(slot) < Date.parse(i.booked) + i.duration * 60000 &&
      Date.parse(slot) + invite.duration * 60000 > Date.parse(i.booked),
  );
}
export function bookInterview(
  s: JourneyState,
  id: string,
  slot: string,
  now = Date.now(),
): JourneyState {
  if (s.invites[id]?.booked)
    throw Error("This interview has already been booked.");
  if (!slotAvailable(s, id, slot, now))
    throw Error("This time is no longer available. Choose another slot.");
  return {
    ...s,
    invites: { ...s.invites, [id]: { ...s.invites[id], booked: slot } },
  };
}
export function approveCandidates(
  s: JourneyState,
  candidates: JourneyCandidate[],
  reason: string,
  now = Date.now(),
): JourneyState {
  const next = { ...s, invites: { ...s.invites }, reviews: { ...s.reviews } };
  for (const c of candidates) {
    const route = approvalOutcome(c, s.rules).route;
    if (route !== "passed" && route !== "review")
      throw Error("Only completed assessments can progress.");
    if (s.decisions[c.id])
      throw Error("A final interview decision has already been recorded.");
    if ((route === "review" || s.reviews[c.id]) && reason.trim().length < 10)
      throw Error("Add a review reason of at least 10 characters.");
    if (!s.invites[c.id])
      next.invites[c.id] = invitation(s, c.id, "HR", reason.trim(), now);
    delete next.reviews[c.id];
  }
  return next;
}
export const CANDIDATE_STEPS = [
  "Open invitation",
  "Get ready",
  "Take assessment",
  "Receive next step",
  "Book interview",
  "Attend interview",
];
export const HR_STEPS = [
  "Set the rules",
  "Invite candidates",
  "Review results",
  "Schedule interview",
  "Interview & decide",
];
