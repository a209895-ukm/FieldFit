import assert from "node:assert/strict";
const origin = "http://127.0.0.1:5173";
let checks = 0;
async function call(
  path,
  { cookie = "", data, expected = 200, requestOrigin = origin } = {},
) {
  const r = await fetch(origin + path, {
    method: data === undefined ? "GET" : "POST",
    headers: {
      Cookie: cookie,
      Origin: requestOrigin,
      ...(data === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const raw = await r.text();
  assert.equal(r.status, expected, `${path}: ${raw}`);
  checks++;
  return {
    data: r.headers.get("content-type")?.includes("application/json")
      ? JSON.parse(raw)
      : raw,
    response: r,
  };
}
await call("/api/candidates", { data: {}, expected: 401 });
const { response: bootstrap, data: empty } = await call("/api/workspace");
assert.equal(empty.candidates.length, 0);
const cookie = bootstrap.headers
  .getSetCookie()
  .map((s) => s.split(";")[0])
  .join("; ");
assert.ok(cookie);
const { data: w } = await call("/api/workspace", { cookie });
assert.equal(w.user.role, "admin");
await call("/api/candidates", {
  cookie,
  data: {},
  requestOrigin: "https://untrusted.example",
  expected: 403,
});
await call("/api/candidates", {
  cookie,
  data: { name: "x", email: "invalid" },
  expected: 400,
});
const { data: invite } = await call("/api/candidates", {
  cookie,
  data: {
    name: "QA Test Candidate",
    email: "qa@example.test",
    language: "ms",
    kind: "candidate",
  },
});
const assessment = invite.path.replace("/assess/", "/api/assessment/");
const { data: initial } = await call(assessment);
assert.equal(initial.questions.length, 12);
assert.ok(
  initial.questions.every((q) => !("points" in q) && !("explanation" in q)),
);
await call(assessment + "/start", {
  data: { language: "ms", consent: false },
  expected: 400,
});
const { response: start } = await call(assessment + "/start", {
  data: { language: "ms", consent: true },
});
const candidateCookie = start.headers
  .getSetCookie()
  .map((s) => s.split(";")[0])
  .join("; ");
await call(assessment, { expected: 403 });
const { data: isolated, response: other } = await call("/api/workspace", {
  cookie: candidateCookie,
});
assert.equal(isolated.candidates.length, 0);
const otherCookie = other.headers
  .getSetCookie()
  .map((s) => s.split(";")[0])
  .join("; ");
await call("/api/candidates/" + invite.id + "/review", {
  cookie: otherCookie,
  data: { ratings: [4, 4, 4, 4], notes: "Must not cross workspace boundaries" },
  expected: 404,
});
await call(assessment + "/start", {
  cookie: candidateCookie,
  data: { language: "ms", consent: true },
  expected: 409,
});
await call(assessment + "/submit", {
  cookie: candidateCookie,
  data: { answers: {}, conversation: "", revision: 0 },
  expected: 400,
});
const partial = { [initial.questions[0].id]: 0 };
await call(assessment + "/save", {
  cookie: candidateCookie,
  data: { answers: partial, conversation: "Draft conversation", revision: 0 },
});
await call(assessment + "/save", {
  cookie: candidateCookie,
  data: { answers: partial, conversation: "Stale answer", revision: 0 },
  expected: 409,
});
const { data: resumed } = await call(assessment, { cookie: candidateCookie });
assert.deepEqual(resumed.answers, partial);
assert.equal(resumed.revision, 1);
const { data: w2 } = await call("/api/workspace", { cookie });
const record = w2.candidates.find((c) => c.id === invite.id);
const correct = Object.fromEntries(
  record.assessment.questions.map((q) => [q.id, q.points.indexOf(100)]),
);
await call(assessment + "/event", { cookie: candidateCookie, data: {} });
await call(assessment + "/submit", {
  cookie: candidateCookie,
  data: {
    answers: correct,
    conversation:
      "I understand the delay was frustrating. Could we review the order and delivery requirements? I will check availability and agree a realistic follow-up time.",
    revision: 1,
    scores: [1, 1, 1, 1, 1, 1],
  },
});
await call(assessment + "/save", {
  cookie: candidateCookie,
  data: { answers: {}, conversation: "tampered", revision: 2 },
  expected: 409,
});
const { data: w3 } = await call("/api/workspace", { cookie });
const completed = w3.candidates.find((c) => c.id === invite.id);
assert.deepEqual(completed.scores, [100, 100, 100, 100, 100, 100]);
assert.equal(completed.switches, 1);
assert.equal(completed.status, "Completed");
await call("/api/candidates/" + invite.id + "/review", {
  cookie,
  data: {
    ratings: [3, 4, 3, 4],
    notes:
      "QA rubric review: empathy, clarification and next steps are present.",
  },
});
await call("/api/candidates/" + invite.id + "/decision", {
  cookie,
  data: {
    decision: "Interview",
    reason: "QA test decision only; no real candidate is involved.",
  },
});
await call("/api/candidates/" + invite.id + "/outcome", {
  cookie,
  data: { month: 3, retained: true, salesKpi: 100, notes: "Test" },
  expected: 400,
});
await call("/api/candidates/nonexistent/decision", {
  cookie,
  data: { decision: "Interview", reason: "Should not be saved" },
  expected: 404,
});
const exported = await call("/api/export", { cookie, data: {} });
assert.ok(exported.data.includes("QA Test Candidate"));
assert.ok(exported.data.includes("100"));
const { data: demo } = await call("/api/demo");
assert.ok(demo.questions.every((q) => !("points" in q)));
assert.equal(demo.questions.length, 12);
console.log(
  `PASS: ${checks} API checks covering automatic workspace isolation, origin protection, invitations, consent, one-use sessions, resume, stale writes, server scoring, reviews, decisions, exports, and demo isolation.`,
);
