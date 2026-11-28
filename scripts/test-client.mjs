// Client requirements (TCP Red Bull Malaysia pilot): roles, job-level blueprints,
// client scoring, open-ended marking, tab-switch auto-submit and Excel import.
import assert from "node:assert/strict";
import { createDemoTransport } from "../lib/demo-api.ts";
import { CLIENT_QUESTIONS } from "../lib/client-bank.ts";
import { questionsFromRows } from "../lib/bank-import.ts";
import { integrityFlags, scoreAnswers } from "../lib/assessment.ts";

const memory = new Map();
const storage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, value),
};
let as = "hr@company.example";
const request = createDemoTransport(storage, Date.now, () => as);
const post = async (path, input) =>
  request("/api/" + path, { method: "POST", body: JSON.stringify(input) });
const workspace = async () => (await request("/api/workspace")).json();

// Unknown accounts are refused.
as = "nobody@company.example";
assert.equal((await request("/api/workspace")).status, 401);

// A second hiring manager, added by the Master Admin.
as = "admin@company.example";
await post("users", { email: "mt.manager@company.example", name: "MT Manager", role: "manager" });
// HR invites; job role sets the blueprint.
as = "hr@company.example";
const invite = async (role, manager) =>
  (
    await (
      await post("candidates", {
        name: "Test " + role,
        email: role + "@example.test",
        language: "en",
        kind: "candidate",
        role,
        manager,
      })
    ).json()
  ).path.split("/").at(-1);
const dsr = await invite("dsr", "manager@company.example");
const se = await invite("se", "mt.manager@company.example");
const asm = await invite("asm", "manager@company.example");
const get = async (t) => (await request("/api/assessment/" + t)).json();
const e = await get(dsr),
  j = await get(se),
  s = await get(asm);
// Lengths follow the blueprint, capped by what the bank holds (sample bank for now).
assert.ok(e.questions.length > 12 && e.questions.length <= 24);
assert.equal(e.minutes, 30);
assert.ok(j.questions.length > 12 && j.questions.length <= 30);
assert.equal(j.minutes, 40);
assert.equal(s.minutes, 50);
assert.equal(s.questions.filter((q) => q.format === "open").length, 3);
assert.ok(e.questions.every((q) => q.points === undefined && q.rubric === undefined));
assert.equal(
  e.questions.filter((q) => q.level === "Entry").length,
  2,
  "Every Entry sample item is used",
);
assert.ok(!e.questions.some((q) => q.level && q.level !== "Entry"));
assert.equal(e.roleTitle, "Sales Representative (DSR) - GT");

// Hiring managers see only their assigned candidates and cannot invite.
as = "manager@company.example";
let w = await workspace();
assert.deepEqual(
  w.candidates.map((c) => c.role).sort(),
  ["asm", "dsr"],
);
assert.equal((await post("candidates", { name: "X", email: "x@y.z" })).status, 403);
assert.equal((await post("users", { email: "a@b.c", name: "A", role: "hr" })).status, 403);

// Only the Master Admin manages users.
as = "admin@company.example";
assert.equal(
  (await post("users", { email: "new@company.example", name: "New HR", role: "hr" })).status,
  200,
);
assert.ok((await workspace()).users.some((u) => u.email === "new@company.example"));

// Tab switches: two warnings, the third submits automatically.
const path = "assessment/" + dsr;
await post(path + "/start", { language: "ms", consent: true });
assert.equal((await (await post(path + "/event", {})).json()).status, "In progress");
assert.equal((await (await post(path + "/event", {})).json()).status, "In progress");
const third = await (await post(path + "/event", {})).json();
assert.equal(third.status, "Completed");
as = "hr@company.example";
w = await workspace();
assert.equal(w.candidates.find((c) => c.role === "dsr").autoSubmitted, "tab switches");

// Senior: open-ended answers are required, then marked by a reviewer.
const spath = "assessment/" + asm;
await post(spath + "/start", { language: "en", consent: true });
const answers = Object.fromEntries(
  s.questions.filter((q) => q.format !== "open").map((q) => [q.id, 0]),
);
const written = Object.fromEntries(
  s.questions.filter((q) => q.format === "open").map((q) => [q.id, "A thorough written answer with reasoning."]),
);
const comm = {
  mode: "typed",
  listening: {
    answers: Object.fromEntries(s.listening.questions.map((q) => [q.id, 0])),
    plays: 1,
  },
};
const body = { answers, written: {}, conversation: "I understand, let me check and call you back today.", communication: comm, revision: 0 };
assert.equal((await post(spath + "/submit", body)).status, 400);
assert.equal(
  (await post(spath + "/submit", { ...body, written })).status,
  200,
);
const asmRecord = (await workspace()).candidates.find((c) => c.role === "asm");
const openIds = Object.keys(written);
as = "manager@company.example";
assert.equal(
  (await post(`candidates/${asmRecord.id}/open-review`, { marks: { [openIds[0]]: 100 } })).status,
  200,
  "Assigned hiring manager can mark open-ended answers",
);
assert.equal(
  (await post(`candidates/${asmRecord.id}/open-review`, { marks: { [openIds[0]]: 70 } })).status,
  400,
);

// Client scoring: -2.0 fraud answers flag integrity and capability scores never go below 0.
const fraud = CLIENT_QUESTIONS.find((q) => q.points.includes(-200));
const pick = { [fraud.id]: fraud.points.indexOf(-200) };
assert.equal(scoreAnswers([fraud], pick)[fraud.cap], 0);
assert.equal(integrityFlags([fraud], pick)[0].severity, "Fraud");

// Excel import (layout of tab "4. Your Questions").
const rows = [
  ["Step 4"],
  ["Item ID (auto)", "Capability", "Job level", "Format", "Based on a real situation?", "Scenario (what happens)", "Question to the candidate", "Option A", "Score A", "Option B", "Score B", "Option C", "Score C", "Option D", "Score D", "Open-ended only: what a strong answer must include", "Related sample file (Step 5)", "Notes"],
  ["EXAMPLE", "Situational Judgement (SJT)", "Entry", "Weighted judgement", "", "x", "y", "a", 1, "b", 0, "c", -0.5, "d", -1],
  ["", "Problem-Solving", "Junior", "Single correct answer", "", "A van is late.", "What first?", "Call", 1, "Wait", 0, "", null, "", null],
  ["", "Logical Thinking", "Senior", "Open-ended (written / spoken)", "", "Sales fell.", "Why?", "", null, "", null, "", null, "", null, "Full: links causes"],
  ["", "Unknown", "Entry", "Single correct answer", "", "", "Bad row", "a", 1, "b", 0],
];
const imported = questionsFromRows(rows, CLIENT_QUESTIONS);
assert.equal(imported.questions.length, 2);
assert.equal(imported.questions[0].id, "TRB-PS-J1");
assert.equal(imported.questions[0].options.en.length, 2);
assert.equal(imported.questions[1].format, "open");
assert.equal(imported.skipped.length, 1);
console.log(
  "Client checks passed: staff roles and manager visibility, job-level blueprints, open-ended marking, tab-switch auto-submit, client scoring and Excel import.",
);
