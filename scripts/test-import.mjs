import assert from "node:assert/strict";
import { parseCandidates } from "../lib/candidate-import.ts";
const d = { role: "dsr", language: "en", manager: "" };
const m = ["manager@company.example"];
const rows = parseCandidates(
  "name,email,job role,language,hiring manager email\nAina Rahman,aina@example.com,DSR,BM,manager@company.example\nMarcus Tan,marcus@example.com,SE,Mandarin,\n\"Lim, Siti\",siti@example.com,Assistant Sales Manager,English,\nBad Row,not-an-email,DSR,,\nNo Manager,x@example.com,ME,,boss@x.com",
  d, m);
assert.deepEqual(rows.map((r) => [r.role, r.language, r.error ?? "ok"]), [
  ["dsr", "ms", "ok"], ["se", "zh", "ok"], ["asm", "en", "ok"], ["dsr", "en", "Invalid email"], ["me", "en", "Unknown hiring manager"],
]);
assert.equal(rows[2].name, "Lim, Siti");
const txt = parseCandidates("aina@example.com Aina Rahman\nMarcus Tan\tmarcus@example.com", d, m);
assert.equal(txt.length, 2);
console.log("Candidate import checks passed.", JSON.stringify(txt.map((r) => [r.name, r.email, r.error ?? "ok"])));
