import assert from "node:assert/strict";
import { createDemoTransport } from "../lib/demo-api.ts";
import { scoreAnswers } from "../lib/assessment.ts";

const memory = new Map();
const storage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, value),
};
let time = Date.now();
const request = createDemoTransport(storage, () => time);
const post = async (path, input) =>
  request("/api/" + path, { method: "POST", body: JSON.stringify(input) });
const workspace = async () => (await request("/api/workspace")).json();
assert.equal((await workspace()).candidates.length, 0);
const practice = await (await request("/api/demo")).json();
assert.equal(practice.questions.length, 12);
assert.equal(practice.questions[0].points, undefined);
const invitation = await (
  await post("candidates", {
    name: "Demo Candidate",
    email: "demo@example.com",
    language: "en",
    kind: "candidate",
  })
).json();
const token = invitation.path.split("/").at(-1);
const path = "assessment/" + token;
assert.equal(
  (await post(path + "/start", { language: "en", consent: false })).status,
  400,
);
assert.equal(
  (await post(path + "/start", { language: "ms", consent: true })).status,
  200,
);
let assessment = await (await request("/api/" + path)).json();
assert.equal(assessment.language, "ms");
assert.equal(assessment.status, "In progress");
const answers = Object.fromEntries(assessment.questions.map((q) => [q.id, 0]));
const input = {
  answers,
  conversation:
    "I will check the order details and confirm a realistic next step with you.",
  revision: 0,
};
assert.equal((await post(path + "/save", input)).status, 200);
assert.equal((await post(path + "/save", input)).status, 409);
const reloaded = createDemoTransport(storage, () => time);
assessment = await (await reloaded("/api/" + path)).json();
assert.deepEqual(assessment.answers, answers);
assert.equal(assessment.revision, 1);
assert.equal(
  (
    await post(path + "/submit", {
      ...input,
      revision: 1,
      scores: [100, 100, 100, 100, 100, 100],
    })
  ).status,
  200,
);
let candidate = (await workspace()).candidates[0];
assert.equal(candidate.status, "Completed");
assert.deepEqual(
  candidate.scores,
  scoreAnswers(candidate.assessment.questions, answers),
);
assert.equal(
  (
    await post("candidates/" + candidate.id + "/review", {
      ratings: [3, 3, 3, 3],
    })
  ).status,
  400,
);
assert.equal(
  (
    await post("candidates/" + candidate.id + "/review", {
      ratings: [3, 3, 3, 3],
      notes: "Clear evidence of an honest and practical next step.",
    })
  ).status,
  200,
);
assert.equal(
  (
    await post("candidates/" + candidate.id + "/decision", {
      decision: "Hire",
      reason: "Strong customer handling supported by interview evidence.",
    })
  ).status,
  200,
);
assert.equal(
  (
    await post("candidates/" + candidate.id + "/outcome", {
      month: 3,
      retained: true,
      salesKpi: 85,
    })
  ).status,
  200,
);
candidate = (await workspace()).candidates[0];
assert.equal(candidate.review.score, 75);
assert.equal(candidate.outcomes[0].salesKpi, 85);
const exported = await post("export", {});
assert.match(await exported.text(), /Demo Candidate/);
const otherBrowser = createDemoTransport({
  getItem: () => null,
  setItem: () => {},
});
assert.equal((await otherBrowser("/api/" + path)).status, 404);
const next = await (
  await post("candidates", {
    name: "Timed Candidate",
    email: "timed@example.com",
    language: "en",
    kind: "candidate",
  })
).json();
await post(next.path.slice(1).replace("assess/", "assessment/") + "/start", {
  language: "en",
  consent: true,
});
time += 41 * 60 * 1000;
const timed = await (
  await request("/api" + next.path.replace("/assess/", "/assessment/"))
).json();
assert.equal(timed.status, "Completed");
const unavailable = createDemoTransport({
  getItem: () => {
    throw new Error("Blocked");
  },
  setItem: () => {},
});
assert.equal((await unavailable("/api/workspace")).status, 503);
console.log(
  "Pages demo passed: both entry data flows, invitation, consent, saved progress, stale writes, scoring, review, decision, follow-up, CSV, isolation and timer.",
);
