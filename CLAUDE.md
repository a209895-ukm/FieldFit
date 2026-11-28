# FieldFit — AceSolutions × TCP Red Bull Malaysia

Front-line sales candidate assessment MVP. Built by AceSolutions (UKM student team) for **TCP Red Bull Malaysia**
(legal client: Yee Lee Marketing Sdn Bhd; the platform must show the TCP Red Bull Malaysia name, never "Yee Lee").
Started as the Kabel DXP challenge entry; now a 10-week client project (Nov 2026 – Jan 2027).

- Live demo: https://a209895-ukm.github.io/FieldFit/ (GitHub Pages, `main` branch, repo root)
- Client meeting: every Wednesday 4:00–4:30 PM, Microsoft Teams. Weekly log due each week.
- Client source material (outside this repo, in `..\`): `FieldFit_Question_Bank_Input_Form (Final)_18.11.2026.xlsx`,
  meeting transcripts in `..\Meeting summary + transcript\`, proposal PDFs in `..\output\`.

## Current focus (from Week 4)

**Clean up and simplify the prototype.** It has too many screens, buttons, banners and notices. It feels
complicated for HR staff and for candidates, many of whom take the test on a phone in Bahasa Malaysia.

- Aim for fewer screens, one obvious primary action per screen, and less explanatory text.
- Keep every client-agreed feature (list below). Merge or hide things; don't delete capability unless the team agrees.
- Areas that feel heaviest (check with the team before removing):
  - Overview, Candidates and the 5-step HR journey overlap.
  - The "Sample profiles / My candidates" switch.
  - Repeated pilot banners and notices.
  - Demo guide and walkthrough "Demo controls".
  - The Assessments info page.
  - The long profile sheet with three tabs.
- Ask Tan before making big layout decisions. He prefers to give raw input first, then have it polished.

## Agreed features by interface

**Candidate** (personal single-use link, no login)
- Invitation and accept
- Language (EN / BM / 中文, switchable any time), consent and rules
- Unscored practice set
- Assessment sized by job level:
  - Random questions with shuffled options
  - Open-ended questions for Senior
  - Per-question and overall timers
  - Calculator on numerical items
  - Autosave
- Spoken task: listen to a voicemail, record a reply (or type it)
- Tab/window-switch warnings, then auto-submit
- After submitting:
  - Path A: book an interview slot (Outlook link / .ics) and confirm attendance
  - Path B: HR review
- Application status

**HR**
- Rules: manual/automatic progression, benchmark, minimum section, maximum gap, warning limit
- Interview slots (manual upload)
- Invite candidates: job role, hiring manager, language
- Invite benchmark employees
- Results:
  - Radar chart and weighted score
  - Integrity flags
  - Strengths, gaps and risks, with interview probes
- Exception review: approve, hold or decline
- Mark open-ended answers; manual rubric vs AI-suggested score for the spoken reply
- Compare up to 3; CSV export
- Question bank: add, edit, retire, Excel import
- Interview decision (Hire / Hold / Reject)
- 3- and 6-month follow-up

**Master Admin:** everything HR can do, plus user accounts and roles, purge after 180 days (PDPA) and the audit trail.

**Hiring Manager:**
- Sees only assigned candidates; reviews them, marks answers and records the decision.
- Cannot invite, change rules or edit the bank.

Not built yet:
- Second spoken task for Junior roles
- Official logo and brand colours (waiting on the client)
- Reviewed BM and Mandarin translations of client questions
- Live Outlook sync and Microsoft 365 sign-in (waiting on IT)

## Client rules (source: the Final input form, tab "1. About the Job Roles")

- Job roles (`lib/client-config.ts`):
  - Entry: DSR, ME
  - Junior: SE
  - Senior: Roving Team Supervisor, ASM, SM
- Test length:
  - Entry: ~30 min, 24 questions + 1 spoken task
  - Junior: ~40 min, 30 questions + 2 spoken tasks
  - Senior: ~50 min, 26 questions + 3 open-ended + 1 spoken task
- Capability weights (NUM / LOG / SJT / PS / SLR / DDL):
  - Entry: 15 / 10 / 25 / 10 / 25 / 15
  - Junior: 20 / 10 / 15 / 15 / 20 / 20
  - Senior: 20 / 15 / 15 / 20 / 10 / 20
- Scoring (stored ×100):
  - Single answer: 1 / 0
  - Weighted judgement: +1 / 0 / −0.5 / −1, and **−2 for fraud or falsifying data**
  - Any answer at −1 or below raises an integrity flag, and the candidate always goes to HR.
  - Open-ended: Full 100 / Partial 50 / No credit 0, marked by a reviewer.
- Time per question: 90 s for judgement, 150 s for calculation and data, 480 s for open-ended.
- Keep field terms in English inside BM and Mandarin text: OOS, FEFO, facing, Sub-D, CN, Perfect Store, hit rate.
- Question bank: teammate A is building the full bank. Only 8 sample client questions are in `lib/client-bank.ts`.
  The full bank is loaded through Administration → Question bank → Import Excel, using the layout of tab "4. Your Questions".

## Hosting decision (open)

The client's IT team asked for Microsoft SharePoint / M365 hosting, but no IT contact is available yet.
- Proposal: Option 1 is a standalone MVP now, integrating at Week 8. Option 2 is building directly on SharePoint.
- Until this is decided, **frontend only**: the Pages demo runs entirely in the browser (`lib/demo-api.ts` + localStorage).
- Don't add Google services; the client uses Microsoft (Outlook / Teams).

## Architecture

- **Stack:** React 19, TypeScript, Vite 8, Tailwind 4 and shadcn-style UI (`components/ui`), lucide icons, recharts.
- **Two builds:**
  - `vite --mode pages` = static demo. `lib/client-api.pages.ts` routes `/api/*` to `lib/demo-api.ts` in the browser.
  - The normal build has a Node + SQLite server in `server/`. It is **not** updated with the Week 4 client features.
    Treat the Pages demo as the product for now.
- **Routing:** hash routes in Pages mode.
  - `#/`: welcome
  - `#/login`: staff sign-in
  - `#/employer`: workspace
  - `#/employee`: candidate home
  - `#/assess/<token>`: assessment
  - `#/assess/demo`: practice

Key files:

| File | What |
| --- | --- |
| `app/main.tsx` | Router |
| `app/welcome.tsx`, `app/login.tsx` | Entry pages, staff sign-in, `BrandMark` |
| `app/workspace.tsx` | Staff shell: sidebar, views, invite dialog, compare |
| `app/approvals.tsx` | 5-step HR journey (rules, invite, review, schedule, decide) |
| `app/panels.tsx` | Candidate profile sheet (`Detail`), `Benchmarks`, `Admin` (rules, question bank, privacy, audit) |
| `app/users.tsx` | Master Admin user management |
| `app/assess/[token]/runner.tsx` | Candidate assessment (timers, tab-switch, open-ended, calculator) |
| `app/candidate-journey.tsx` | Candidate inbox, next step, booking |
| `app/demo-guide*.tsx` | Guided client walkthrough (Pages only) |
| `lib/demo-api.ts` | In-browser API: roles, invitations, scoring, auto-submit, export |
| `lib/assessment.ts` | Question types, question selection, scoring, integrity flags |
| `lib/client-config.ts` | Brand, job roles, blueprints, weights, time limits |
| `lib/approval.ts`, `lib/journey.ts` | Routing rules (weighted average, flags), Outlook link / .ics, journey state |
| `lib/question-bank.ts`, `lib/client-bank.ts`, `lib/bank-import.ts` | General items, sample client items, Excel import |
| `lib/session.ts` | Demo staff accounts and session |

Demo staff accounts (no password): `admin@`, `hr@`, `gt.manager@` and `mt.manager@company.example`.

## Commands

Node 24 is expected. Node 22 works with an `EBADENGINE` warning.

```sh
npm install
npm run dev              # Node server version, http://127.0.0.1:5173
npm run check            # tsc
npm test                 # assessment checks
npm run test:pages       # Pages demo API flow
npm run test:client      # client rules: roles, blueprints, scoring, auto-submit, Excel import
node --experimental-strip-types scripts/test-approval.mjs
node --experimental-strip-types scripts/test-journey.mjs
npm run prepare:pages    # build the demo into index.html + site-assets/ at the repo root
```

**Deploy:**
1. Run `npm run prepare:pages`.
2. Commit the source together with the generated `index.html` and `site-assets/`.
3. Push `main`. Pages publishes from the repo root.

## Conventions

- Every candidate-facing string needs EN, BM and 中文 (see the `copy` / `extra` objects in `runner.tsx`).
- Assessment scores inform the interview; a person always makes the hiring decision. Never auto-reject.
- Use only fictional people and data in demos. Never commit real candidate data or the client's sample files.
- This checkout is on Windows. Write files with LF line endings, and don't commit line-ending-only changes.
- Keep commits focused. Run `check` and the tests before pushing.
