import assert from "node:assert/strict";
import {
  emptyJourney,
  normalizeJourney,
  syncAutomatic,
  approveCandidates,
  bookInterview,
  slotAvailable,
} from "../lib/journey.ts";
const now = Date.parse("2026-11-04T00:00:00Z");
const slots = [
  "2026-11-05T02:00:00Z",
  "2026-11-05T02:15:00Z",
  "2026-11-05T02:30:00Z",
];
const pass = {
  id: "pass",
  name: "Pass",
  email: "pass@example.test",
  status: "Completed",
  scores: [88, 85, 90, 80, 85, 92],
};
const uneven = { ...pass, id: "uneven", scores: [98, 94, 92, 95, 25, 96] };
const below = { ...pass, id: "below", scores: [45, 50, 55, 50, 45, 50] };
let state = {
  ...emptyJourney(),
  host: "hr@example.test",
  slots,
  rules: { ...emptyJourney().rules, automatic: true },
};
const next = syncAutomatic(
  state,
  [
    pass,
    uneven,
    below,
    { ...pass, id: "staff", kind: "employee" },
    { ...pass, id: "pending", status: "Invited" },
  ],
  now,
);
assert.deepEqual(Object.keys(next.invites), ["pass"]);
assert.equal(
  state.invites.pass,
  undefined,
  "Automatic routing must not mutate the prior snapshot",
);
assert.equal(
  syncAutomatic(next, [pass, uneven, below], now),
  next,
  "Automatic routing is idempotent",
);
assert.equal(
  syncAutomatic({ ...state, slots: [] }, [pass], now).invites.pass,
  undefined,
);
assert.equal(
  syncAutomatic(
    {
      ...state,
      reviews: { pass: { action: "hold", reason: "Needs review", at: "" } },
    },
    [pass],
    now,
  ).invites.pass,
  undefined,
  "Automation must respect an HR hold",
);
assert.equal(
  syncAutomatic(
    {
      ...state,
      reviews: {
        pass: { action: "decline", reason: "Not progressing", at: "" },
      },
    },
    [pass],
    now,
  ).invites.pass,
  undefined,
);
assert.equal(
  syncAutomatic(
    {
      ...state,
      decisions: {
        pass: { decision: "Reject", reason: "Already reviewed", at: "" },
      },
    },
    [pass],
    now,
  ).invites.pass,
  undefined,
);
assert.throws(
  () => approveCandidates(next, [uneven], "", now),
  /review reason/,
);
const approved = approveCandidates(
  next,
  [uneven, below],
  "HR will explore the gaps at interview.",
  now,
);
assert.equal(approved.invites.uneven.source, "HR");
assert.equal(
  approved.invites.below.reason,
  "HR will explore the gaps at interview.",
);
const booked = bookInterview(approved, "pass", slots[0], now);
assert.equal(booked.invites.pass.booked, slots[0]);
assert.equal(slotAvailable(booked, "uneven", slots[0], now), false);
assert.equal(
  slotAvailable(booked, "uneven", slots[1], now),
  false,
  "Overlapping slots must be unavailable",
);
assert.equal(
  slotAvailable(booked, "uneven", slots[2], now),
  true,
  "Adjacent interviews may be booked",
);
assert.throws(
  () => bookInterview(booked, "uneven", slots[1], now),
  /no longer available/,
);
assert.throws(
  () => bookInterview(booked, "pass", slots[2], now),
  /already been booked/,
);
assert.throws(
  () => bookInterview(booked, "uneven", "2026-11-06T02:00:00Z", now),
  /no longer available/,
);
assert.equal(
  slotAvailable(booked, "uneven", slots[2], Date.parse(slots[2]) + 1),
  false,
);
const second = bookInterview(booked, "uneven", slots[2], now);
assert.equal(second.invites.uneven.booked, slots[2]);
const old = normalizeJourney({
  rules: state.rules,
  host: "hr@example.test",
  slots,
  invites: next.invites,
});
assert.deepEqual(old.reviews, {});
assert.deepEqual(old.decisions, {});
assert.equal(old.invites.pass.source, "Automatic");
const held = {
  ...state,
  reviews: { uneven: { action: "hold", reason: "Review", at: "" } },
};
assert.equal(
  approveCandidates(held, [uneven], "Reviewed and approved for interview.", now)
    .reviews.uneven,
  undefined,
);
console.log(
  "Journey checks passed: auto/manual routing, exception priority, HR holds, bulk approvals, migration, stale/overlapping booking prevention.",
);
