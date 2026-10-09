import assert from "node:assert/strict";
import {
  chooseQuestions,
  scoreAnswers,
  profile,
  DEFAULT_RULES,
  csvCell,
  upgradeSettings,
} from "../lib/assessment.ts";
import { QUESTIONS } from "../lib/question-bank.ts";
import {
  communicationScore,
  safeListening,
  paceMarks,
  fluencyMarks,
  countUnits,
} from "../lib/communication.ts";
import {
  LISTENING,
  PRACTICE_LISTENING,
  PRACTICE_QUESTIONS,
} from "../lib/communication-bank.ts";
const chosen = chooseQuestions(QUESTIONS, () => 0.5);
assert.equal(chosen.length, 12);
assert.equal(new Set(chosen.map((q) => q.id)).size, 12);
for (let i = 0; i < 6; i++)
  assert.equal(chosen.filter((q) => q.cap === i).length, 2);
const correct = Object.fromEntries(
  chosen.map((q) => [q.id, q.points.indexOf(100)]),
);
assert.deepEqual(scoreAnswers(chosen, correct), [100, 100, 100, 100, 100, 100]);
assert.deepEqual(scoreAnswers(chosen, {}), [0, 0, 0, 0, 0, 0]);
assert.equal(
  profile([60, 80, 59, 0, 0, 100], DEFAULT_RULES)[0].level,
  "Proficient",
);
assert.equal(
  profile([60, 80, 59, 0, 0, 100], DEFAULT_RULES)[1].level,
  "Strong",
);
assert.equal(
  profile([60, 80, 59, 0, 0, 100], DEFAULT_RULES)[2].type,
  "Core risk",
);
assert.equal(
  profile([60, 80, 59, 0, 0, 100], DEFAULT_RULES)[3].type,
  "Development gap",
);
for (const q of QUESTIONS) {
  for (const lang of ["en", "ms", "zh"]) {
    assert.ok(q.prompt[lang]);
    assert.equal(q.options[lang].length, 4);
  }
  assert.ok(q.points.includes(100));
}
assert.equal(csvCell('=HYPERLINK("bad")'), '"\'=HYPERLINK(""bad"")"');

// Shuffling: order and answers vary, but every option keeps its own points in every language.
let seed = 7;
const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const runs = Array.from({ length: 20 }, () =>
  chooseQuestions(QUESTIONS, random),
);
assert.ok(new Set(runs.map((r) => r.map((q) => q.id).join())).size > 1);
assert.ok(new Set(runs.map((r) => r[0].options.en.join())).size > 1);
for (const run of runs)
  for (const q of run) {
    const original = QUESTIONS.find((o) => o.id === q.id);
    for (const lang of ["en", "ms", "zh"]) {
      assert.equal(q.options[lang].length, 4);
      q.options[lang].forEach((text, i) => {
        const from = original.options.en.indexOf(q.options.en[i]);
        assert.equal(original.options[lang][from], text);
        assert.equal(original.points[from], q.points[i]);
      });
    }
  }

// Visual questions carry every label in all three languages.
const allVisual = [...QUESTIONS, ...PRACTICE_QUESTIONS].filter((q) => q.visual);
assert.ok(QUESTIONS.filter((q) => q.visual).length >= 3);
for (const { visual: v } of allVisual)
  for (const lang of ["en", "ms", "zh"]) {
    assert.ok(v.title[lang]);
    if (v.kind === "bar") {
      assert.equal(v.categories[lang].length, v.series[0].values.length);
      for (const s of v.series) assert.ok(s.name[lang]);
    } else {
      assert.equal(v.columns[lang].length, v.rows[lang][0].length);
      for (const tile of v.tiles) assert.ok(tile.label[lang]);
    }
  }

// Practice items never overlap with the real bank.
const real = new Set(QUESTIONS.map((q) => q.id));
assert.equal(PRACTICE_QUESTIONS.length, 6);
assert.ok(PRACTICE_QUESTIONS.every((q) => !real.has(q.id)));
for (const clip of [LISTENING, PRACTICE_LISTENING]) {
  for (const lang of ["en", "ms", "zh"]) assert.ok(clip.script[lang]);
  for (const q of clip.questions) {
    assert.ok(q.points.includes(100));
    for (const lang of ["en", "ms", "zh"])
      assert.equal(q.options[lang].length, 4);
  }
}
assert.ok(safeListening(LISTENING).questions.every((q) => !("points" in q)));

// Saved banks from before this release pick up revised items and the new time limit.
const old = {
  rules: { ...DEFAULT_RULES, minutes: 40 },
  questions: QUESTIONS.map(({ visual, rev, ...q }) => ({
    ...q,
    enabled: q.id !== "DIG-01",
  })),
};
const upgraded = upgradeSettings(old, QUESTIONS);
assert.equal(upgraded.rules.minutes, 20);
assert.ok(upgraded.questions.find((q) => q.id === "DIG-03").visual);
assert.equal(upgraded.questions.find((q) => q.id === "DIG-01").enabled, false);
const edited = { ...old, rules: { ...old.rules, version: 2 } };
assert.equal(upgradeSettings(edited, QUESTIONS).rules.minutes, 40);

// Communication marks: listening 30, content 40, delivery 30.
const comm = {
  language: "en",
  assessment: { listening: LISTENING },
  communication: {
    mode: "voice",
    listening: {
      answers: Object.fromEntries(
        LISTENING.questions.map((q) => [q.id, q.points.indexOf(100)]),
      ),
      plays: 1,
    },
    metrics: {
      durationSec: 70,
      units: 160,
      pace: 137,
      longPauses: 1,
      attempts: 1,
      transcribed: true,
    },
  },
};
let s = communicationScore(comm);
assert.equal(s.listening, 30);
assert.equal(s.pending, true);
assert.deepEqual(s.suggested, { pace: 10, fluency: 8 });
s = communicationScore({
  ...comm,
  review: {
    ratings: [4, 4, 3, 3],
    delivery: { clarity: 3, pace: 10, fluency: 8 },
  },
});
assert.deepEqual(
  [s.content, s.delivery, s.total, s.max, s.pending],
  [35, 26, 91, 100, false],
);
const typed = communicationScore({
  ...comm,
  communication: { ...comm.communication, mode: "typed", metrics: undefined },
  review: { ratings: [2, 2, 2, 2] },
});
assert.deepEqual([typed.delivery, typed.max, typed.pending], [null, 70, false]);
assert.equal(paceMarks(80, "en"), 7);
assert.equal(paceMarks(200, "zh"), 10);
assert.equal(paceMarks(null, "ms"), null);
assert.equal(fluencyMarks(0, 12), 5);
assert.equal(countUnits("Saya akan semak pesanan anda.", "ms"), 5);
assert.equal(countUnits("我会帮你检查订单 OK", "zh"), 9);
assert.equal(communicationScore({ language: "en", assessment: {} }), null);
console.log(
  "PASS: question selection, shuffled answers, translation parity, visuals, practice isolation, settings upgrade, scoring boundaries, profiling, communication marks and CSV formula escaping.",
);
