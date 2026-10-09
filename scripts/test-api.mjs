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
assert.equal(initial.listening.questions.length, 3);
assert.ok(initial.listening.questions.every((q) => !("points" in q)));
assert.ok(initial.speaking.customer.ms);
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
const listeningKey = Object.fromEntries(
  record.assessment.listening.questions.map((q) => [
    q.id,
    q.points.indexOf(100),
  ]),
);
// Binary voice upload: wrong type rejected, recording stored for the hiring team.
const upload = (type, bytes, cookieHeader = candidateCookie) =>
  fetch(origin + assessment + "/audio", {
    method: "POST",
    headers: { Cookie: cookieHeader, Origin: origin, "Content-Type": type },
    body: bytes,
  });
assert.equal(
  (await upload("text/plain", new Uint8Array([1, 2, 3]))).status,
  415,
);
assert.equal(
  (await upload("audio/webm", new Uint8Array([1, 2, 3]), "")).status,
  403,
);
const stored = await upload("audio/webm", new Uint8Array(2048).fill(7));
assert.equal(stored.status, 200);
checks += 3;
await call(assessment + "/submit", {
  cookie: candidateCookie,
  data: {
    answers: correct,
    conversation: "",
    communication: {
      mode: "voice",
      listening: { answers: {}, plays: 1 },
      metrics: {
        durationSec: 40,
        units: 90,
        pace: 135,
        longPauses: 0,
        attempts: 1,
        transcribed: false,
      },
    },
    revision: 1,
  },
  expected: 400,
});
await call(assessment + "/submit", {
  cookie: candidateCookie,
  data: {
    answers: correct,
    conversation:
      "I understand the delay was frustrating. Could we review the order and delivery requirements? I will check availability and agree a realistic follow-up time.",
    communication: {
      mode: "voice",
      listening: { answers: listeningKey, plays: 1 },
      metrics: {
        durationSec: 40,
        units: 90,
        pace: 135,
        longPauses: 0,
        attempts: 1,
        transcribed: true,
      },
      audio: { id: "server", type: "audio/webm" },
    },
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
    delivery: { clarity: 4, pace: 10, fluency: 10 },
  },
});
const audio = await fetch(origin + "/api/candidates/" + invite.id + "/audio", {
  headers: { Cookie: cookie },
});
assert.equal(audio.status, 200);
assert.equal(audio.headers.get("content-type"), "audio/webm");
assert.equal((await audio.arrayBuffer()).byteLength, 2048);
const foreign = await fetch(
  origin + "/api/candidates/" + invite.id + "/audio",
  {
    headers: { Cookie: otherCookie },
  },
);
assert.equal(foreign.status, 404);
checks += 2;
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
assert.ok(exported.data.includes("95/100"));
const { data: demo } = await call("/api/demo");
assert.ok(demo.questions.every((q) => !("points" in q)));
assert.equal(demo.questions.length, 6);
assert.ok(demo.listening.questions.every((q) => !("points" in q)));
console.log(
  `PASS: ${checks} API checks covering automatic workspace isolation, origin protection, invitations, consent, one-use sessions, resume, stale writes, server scoring, voice uploads, communication marks, reviews, decisions, exports, and demo isolation.`,
);
