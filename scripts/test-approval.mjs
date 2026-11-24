import assert from "node:assert/strict";
import {
  approvalOutcome,
  APPROVAL_DEFAULTS,
  outlookCalendarUrl,
  calendarFile,
} from "../lib/approval.ts";
const c = {
  id: "test",
  name: "Sample Candidate",
  email: "candidate@example.test",
  status: "Completed",
  scores: [75, 75, 75, 75, 75, 75],
};
assert.equal(approvalOutcome(c, APPROVAL_DEFAULTS).route, "passed");
assert.equal(
  approvalOutcome({ ...c, scores: [98, 94, 92, 95, 25, 96] }, APPROVAL_DEFAULTS)
    .route,
  "review",
  "A high average must not bypass an exception",
);
assert.equal(
  approvalOutcome(
    { ...c, scores: [100, 100, 100, 100, 100, 59] },
    { ...APPROVAL_DEFAULTS, minimum: 0 },
  ).route,
  "review",
  "Spread rule applies separately from minimum",
);
assert.equal(
  approvalOutcome({ ...c, scores: [74, 74, 74, 74, 74, 74] }, APPROVAL_DEFAULTS)
    .route,
  "review",
);
assert.equal(
  approvalOutcome(
    { ...c, scores: [75, 75, 75, 75, 75, NaN] },
    APPROVAL_DEFAULTS,
  ).route,
  "review",
);
assert.equal(
  approvalOutcome({ ...c, scores: [] }, APPROVAL_DEFAULTS).route,
  "review",
);
assert.equal(
  approvalOutcome({ ...c, kind: "employee" }, APPROVAL_DEFAULTS).route,
  "waiting",
);
assert.equal(
  approvalOutcome({ ...c, status: "In progress" }, APPROVAL_DEFAULTS).route,
  "waiting",
);
assert.equal(
  approvalOutcome({ ...c, decision: { decision: "Reject" } }, APPROVAL_DEFAULTS)
    .route,
  "closed",
);
assert.equal(
  approvalOutcome(
    { ...c, scores: [40, 80, 80, 80, 80, 80] },
    { ...APPROVAL_DEFAULTS, benchmark: 70 },
  ).route,
  "passed",
  "Exact floor and spread boundaries are permitted",
);
const invite = {
  candidateId: "test",
  slots: ["2026-12-01T02:00:00Z"],
  booked: "2026-12-01T02:00:00Z",
  duration: 45,
  host: "hr@example.test",
  location: "Office & online",
  source: "HR",
  created: "2026-11-02",
};
const url = new URL(outlookCalendarUrl(c, invite));
assert.equal(url.hostname, "outlook.office.com");
assert.equal(url.searchParams.get("startdt"), "2026-12-01T02:00:00.000Z");
assert.equal(url.searchParams.get("enddt"), "2026-12-01T02:45:00.000Z");
assert.equal(
  url.searchParams.get("to"),
  "hr@example.test;candidate@example.test",
);
assert.equal(url.searchParams.get("location"), "Office & online");
assert.equal(outlookCalendarUrl(c, { ...invite, booked: undefined }), "");
const ics = await calendarFile(c, invite).text();
assert.match(ics, /DTSTART:20261201T020000Z/);
assert.match(ics, /ATTENDEE;ROLE=REQ-PARTICIPANT:mailto:candidate@example.test/);
// Client rules: capability weights by job level and integrity flags.
assert.equal(
  Math.round(
    approvalOutcome(
      { ...c, level: "Entry", scores: [60, 60, 90, 60, 90, 60] },
      { ...APPROVAL_DEFAULTS, spread: 100, minimum: 0 },
    ).average,
  ),
  75,
  "Entry weights: SJT and self-leadership count 25% each",
);
assert.equal(
  approvalOutcome(
    { ...c, flags: [{ id: "YLM-SJT-E2", severity: "Fraud" }] },
    APPROVAL_DEFAULTS,
  ).route,
  "review",
  "An integrity flag always goes to HR",
);
console.log(
  "Approval routing, exception precedence, boundaries and calendar draft checks passed.",
);
