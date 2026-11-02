import assert from "node:assert/strict";
import {
  approvalOutcome,
  APPROVAL_DEFAULTS,
  googleCalendarUrl,
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
const url = new URL(googleCalendarUrl(c, invite));
assert.equal(
  url.searchParams.get("dates"),
  "20261201T020000Z/20261201T024500Z",
);
assert.equal(
  url.searchParams.get("add"),
  "hr@example.test,candidate@example.test",
);
assert.equal(url.searchParams.get("location"), "Office & online");
assert.equal(googleCalendarUrl(c, { ...invite, booked: undefined }), "");
console.log(
  "Approval routing, exception precedence, boundaries and calendar draft checks passed.",
);
