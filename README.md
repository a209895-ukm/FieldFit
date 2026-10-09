# FieldFit MVP

A private, working pilot for trilingual front-line sales assessment. Built from the supplied FieldFit proposal. This implementation uses React/Vinext and Cloudflare D1 on Sites, following the request to use the easiest stack. It does not require a separately managed Node server or PostgreSQL service.

## What works

- English, Bahasa Malaysia and Mandarin candidate interface and question translations.
- 18 draft items across six capabilities; each invitation receives two randomly selected items per capability and one written customer conversation.
- Consent, a server-enforced timer, resumable answers, tab-change counts and a one-use invitation exchange into an HttpOnly session cookie.
- Invitation expiry, reset/reissue with confirmation, server-side scoring and immutable assessment/rule snapshots per invitation.
- Separate strengths, development gaps and core risks with suggested interview probes and training actions.
- Candidate search, status filters, three-way comparison, radar profiles and Excel-compatible CSV export.
- Fixed human conversation rubric, recorded hiring decisions and 3-/6-month retention and sales-target follow-ups.
- Employee benchmark invitations, high-performer medians and min/max ranges.
- Administrator rules, trilingual question editor, team roles and audit events.
- Managed persistent storage, workspace isolation and server-side role checks. Sample profiles are illustrative UI data and never populate the database.

## Try it

1. Open the private published site and sign in with ChatGPT. The first sign-in creates your isolated HR workspace.
2. Explore Sample data, or switch the candidate table to My candidates.
3. Click Invite candidate, enter a name, email and language, then create the link. FieldFit does not send email; copy and send the link yourself.
4. Open the link in the candidate browser, choose a language and give consent. Starting consumes the invitation; continue on that browser. Use Reset attempt & create new link if a candidate loses access. Resetting clears that attempt.
5. Complete the questions and written conversation. Answers save when navigating between questions. Return to the manager workspace and refresh to load new submissions.
6. Open the profile, review item evidence, score the conversation with the four-part rubric, and record an interview or hiring decision with reasons.
7. For comparison, use Candidates and select two or three completed profiles. Use CSV to export saved records.
8. Use Benchmarks to invite high and typical performers. High-performer results form reference ranges. Record follow-ups on candidates whose decision is Hire.

## Pilot boundaries and requirements

- **Private site:** the published site is owner-private by default. The owner must configure intended site access before external candidates or colleagues can open links. A candidate link does not bypass platform access. Candidate links grant only the named assessment session, never the owner's manager data.
- **AI scoring is not connected.** Conversations require explicit human rubric review and are reported separately from objective capability scores. No fabricated AI scores are used. A production AI adapter needs provider configuration, versioned rubric prompts, structured-output validation, prompt-injection defenses, evaluation against bilingual raters, and human review.
- All questions, translations, capability tags and thresholds are drafts; HR/company reviewers must approve them. Self-leadership items are self-report and vulnerable to socially desirable responses. This compact item bank is not a validated psychometric instrument.
- No statistical reliability, language fairness or predictive validity is claimed. Cronbach's alpha, language difficulty comparison and outcome correlations remain pilot analysis tasks after an adequate reviewed dataset exists. Staff ranges are descriptive, never pass/fail gates.
- The dashboard mean is unweighted and excludes the conversation rubric. Missing objective answers at timeout score zero. The server finalizes saved answers on the next assessment request after expiry; a closed browser is not finalized by a background scheduler.
- Tab-change signals are client-reported and can be blocked or bypassed. They are context, never proof of misconduct. Fast completion is flagged for review. No webcam or biometric monitoring is used.
- Candidate records older than 180 days are hidden from manager lists/exports. An administrator can permanently purge expired records and audit events. Automatic purging, backup retention, candidate correction/deletion workflows and company privacy wording must be configured before a real pilot. No legal compliance certification is implied.
- Team members must be granted platform access separately. New members should join the hiring workspace before independently creating a separate HR workspace.
- A random small item sample provides limited evidence; different item difficulty has not been calibrated. Benchmark comparisons across rule versions require human interpretation.
- One written role-play reply is included, rather than a live multi-turn AI customer.

## Run locally

Requires Node 22.13+ (Node 24 tested) and npm. Install with `npm run install:ci`. On Windows if the npm shim fails, use the installed npm JS entrypoint: `node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run install:ci`.

```
node node_modules/drizzle-kit/bin.cjs generate
node scripts/run-framework.mjs build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_milky_epoch.sql
node scripts/run-framework.mjs dev
```

Apply each new migration once and in order. The development server prints its local URL (normally http://127.0.0.1:5173). Local sign-in simulates seedy@sites.test only on loopback, and is excluded from production. The published site uses platform-verified identity headers. No production credentials belong in source or browser code.

## Verify

```
node node_modules/typescript/bin/tsc --noEmit
node --experimental-strip-types scripts/test-assessment.mjs
node scripts/test-api.mjs
node scripts/run-framework.mjs build
```

The API test requires the local development server and migrated local database. It creates fictional QA records only in that local database. It checks authentication, origin validation, candidate/session isolation, consent, one-use links, answer recovery, stale revisions, score tampering, submission immutability, reviews, decisions and CSV export. The unit test covers question selection, languages, thresholds, profiling and CSV formula protection. The search WebMCP tool was exercised with valid and invalid inputs in the browser.

## Source map

- `app/workspace.tsx`: manager dashboard, invitations and comparisons.
- `app/panels.tsx`: profiles, reviews, benchmark and administration screens.
- `app/assess/[token]/runner.tsx`: trilingual candidate journey.
- `app/api/[...path]/route.ts`: protected API, validation and actions.
- `lib/server.ts`: workspace/session authorization, storage and submission.
- `lib/assessment.ts`: pure scoring and profiling rules.
- `lib/question-bank.ts`: server-only draft questions and scoring keys.
- `db/schema.ts`, `drizzle/`: database schema and migrations.

## Company deployment handover

The source is owned by the project and kept locally as well as in the Sites source repository. To return to the proposal's Node.js + PostgreSQL architecture, retain the React screens and pure scoring module, replace the D1 prepared-statement adapter with a PostgreSQL adapter, port the schema to PostgreSQL, and replace Sites identity headers with company SSO. Keep all authorization and scoring on the server. Deploy only after pilot content review, privacy/retention configuration, access testing, and score validation.
