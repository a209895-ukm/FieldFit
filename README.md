# FieldFit

A web-based candidate assessment MVP for front-line sales teams, with English, Bahasa Malaysia and Mandarin support.

## Try it online

Open **[FieldFit](https://a209895-ukm.github.io/FieldFit/)** and choose **Employee** or **Employer**. Both are open without login. Use **Switch role** to return to the chooser.

- **Employee:** try the trilingual practice assessment or open an invitation.
- **Employer:** explore sample profiles, create demo invitations, review completed assessments, compare candidates and export results.

The GitHub Pages version is an interactive demo. Records are saved in this browser's local storage; invitations work only in the browser that created them. Use fictional details. Clearing site data removes the records. For an end-to-end demo, create an invitation as Employer, open and complete it in the same browser, then return to Employer and select **My candidates**. Separate devices do not share records.

The Node.js version below uses SQLite and supports candidate links across browsers. GitHub Pages does not run that backend.

## Quick start

Requires **Node.js 24 or newer**.

```sh
npm install
npm run dev
```

Open **http://127.0.0.1:5173**. No account, password or external service is required. The SQLite database and its tables are created automatically in `.data/fieldfit.sqlite`.

## Using the app

1. Choose **Employer** on the welcome page. A private workspace is created for your browser automatically. Choose **Employee** for practice assessments and invitations.
2. Explore **Sample data**, or switch to **My candidates** for saved records.
3. Select **Invite candidate**, enter their details and copy the generated link. Email is not sent automatically.
4. Open the link in the candidate's browser, choose a language, give consent and complete the assessment. Starting the test claims the invitation for that browser.
5. Return to the dashboard and refresh. Open the candidate profile to review scores, evidence and interview probes.
6. Score the written conversation using the fixed rubric, then record your decision and supporting reasons.

The **Candidates** screen supports comparison of up to three completed profiles and CSV export. **Benchmarks** lets you invite current employees and compare against high-performer reference ranges. **Administration** contains the question bank, scoring rules, retention controls and audit trail.

## Workspace access

There is no login screen. An opaque HttpOnly cookie gives this browser access to its own workspace; only a hash of the cookie is stored in the database. Another browser receives a separate workspace. Candidate invitation links grant access only to the assigned assessment.

Continue using the same browser to access your records. Clearing cookies or switching browsers does not recover the original workspace. Export records you need to keep. Named users, shared team workspaces and cross-device recovery are outside this no-account MVP.

The development server listens on this computer only. For testing on another device, run the production server with an appropriate `HOST` and `PUBLIC_ORIGIN`; use HTTPS for an internet deployment.

## Assessment features

- Six capabilities: numerical and analytical skills, logical thinking, situational judgement, problem-solving, self-leadership, and digital/data literacy.
- An 18-item draft question bank, with two items randomly selected per capability for each invitation.
- A written customer conversation, scored separately through human rubric review.
- A server-enforced timer, answer saving between questions, resumable sessions and one-use invitation links.
- Immutable question and scoring snapshots for each invitation.
- Strengths, trainable development gaps, core risk flags and suggested interview probes.
- Candidate comparisons, employee benchmark medians/ranges and Excel-compatible CSV exports.
- Recorded decisions, audit events, and 3-/6-month retention and sales-target follow-ups for hires.

## Build and run

```sh
npm run build
npm start
```

The production server serves both the app and its API at **http://127.0.0.1:5173**.

| Environment variable | Default                 | Purpose                                                                             |
| -------------------- | ----------------------- | ----------------------------------------------------------------------------------- |
| `PORT`               | `5173`                  | Server port                                                                         |
| `HOST`               | `127.0.0.1`             | Production listening address                                                        |
| `PUBLIC_ORIGIN`      | `http://127.0.0.1:5173` | Exact origin used by the browser; set this when using a domain or another port/host |
| `FIELDFIT_DATABASE`  | `.data/fieldfit.sqlite` | Persistent database path                                                            |

Set environment variables in the shell or hosting configuration. No `.env` loader or secret key is required. Keep the database directory on persistent storage and back it up separately from source code. SQL migrations in `db/migrations` are applied once at startup and verified by checksum. Restart the development server after changing backend code.

## Project structure

```text
app/                 Source HTML entry, role chooser, dashboard and assessment
components/ui/       Shared interface controls
server/              HTTP API, workspace access and SQLite adapter
lib/                 Assessment logic, question bank and browser demo adapter
db/migrations/       Versioned SQL schema
scripts/             Build helpers and automated checks
public/              Static assets
site-assets/         Generated GitHub Pages JavaScript and CSS
```

The stack is **React, TypeScript, Vite, Node.js and SQLite**. In the Node.js version, scoring, validation and access control stay on the server; candidate responses never determine their own scores. The public Pages demo runs entirely in the browser and is for exploration, not controlled assessments.

## Updating GitHub Pages

```sh
npm run prepare:pages
```

Commit the source changes together with the generated root `index.html`, `favicon.svg`, `.nojekyll` and `site-assets/`, then push to `main`. The repository's existing Pages configuration publishes from `main` at `/`. The editable HTML source is `app/index.html`; the root HTML is generated. The build uses `/FieldFit/` as its base and hash routes so both portals and invitation links work on refresh. `npm run build` still produces the separate Node.js application in `dist/client`.

## Checks

```sh
npm run check
npm test
npm run test:pages
npm run test:api
```

The API check requires the running development server. It creates fictional QA records in isolated browser workspaces and verifies consent, invitation claims, answer recovery, stale writes, scoring, reviews, exports and workspace isolation. Use a separate `FIELDFIT_DATABASE` when running tests alongside real data.

## Pilot limitations

- Questions, translations and thresholds are drafts requiring HR and bilingual review. This is not a validated psychometric instrument.
- Conversation scoring is human-reviewed; an AI scoring service is not connected.
- Self-leadership answers are self-report. Tab-change counts and fast completion are review signals, not proof of misconduct. No webcam is used.
- Benchmark ranges describe the available sample and are not pass/fail cut-offs. Language fairness, reliability and predictive validity require a reviewed pilot dataset.
- Unanswered items score zero when the server finalizes an expired attempt. A closed browser's attempt is finalized on its next assessment request, rather than by a background scheduler.
- Records older than 180 days are hidden from lists and exports. Administrators can purge expired records; automated retention and a formal correction/deletion workflow are not included.
- Final hiring decisions are made and recorded by a person.

Third-party license notices are retained alongside the dependencies and vendored stylesheet.
