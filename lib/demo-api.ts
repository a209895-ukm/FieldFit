import {
  CAPS,
  LANGS,
  DEFAULT_RULES,
  RUBRIC,
  chooseQuestions,
  scoreAnswers,
  csvCell,
  upgradeSettings,
  integrityFlags,
} from "./assessment.ts";
import { QUESTIONS as GENERAL_QUESTIONS } from "./question-bank.ts";
import { CLIENT_QUESTIONS } from "./client-bank.ts";
import {
  BLUEPRINTS,
  DEFAULT_MAX_WARNINGS,
  STAFF_ROLES,
  roleById,
  weightedScore,
} from "./client-config.ts";
import { DEFAULT_USERS, SESSION_KEY, type StaffUser } from "./session.ts";
const QUESTIONS = [...GENERAL_QUESTIONS, ...CLIENT_QUESTIONS];
import {
  COMMUNICATION_COLUMNS,
  communicationCells,
  safeListening,
} from "./communication.ts";
import {
  LISTENING,
  SPEAKING,
  PRACTICE_LISTENING,
  PRACTICE_QUESTIONS,
  PRACTICE_SPEAKING,
} from "./communication-bank.ts";

const KEY = "fieldfit-pages-demo-v1";
type DemoState = {
  settings: { rules: typeof DEFAULT_RULES; questions: typeof QUESTIONS };
  candidates: any[];
  audit: any[];
  users?: StaffUser[];
};
const id = () => crypto.randomUUID();
const accessToken = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(32)), (n) =>
    n.toString(16).padStart(2, "0"),
  ).join("");
const safeQuestions = (questions: typeof QUESTIONS) =>
  questions.map(({ points, explanation, rubric, ...question }) => question);

/** GitHub Pages sandbox. All state is local to this browser; no records are sent to a server. */
export function createDemoTransport(
  storage: Pick<Storage, "getItem" | "setItem">,
  clock = Date.now,
  session: () => string | null = () => storage.getItem(SESSION_KEY),
) {
  function read(): DemoState {
    const raw = storage.getItem(KEY);
    if (raw) {
      const state: DemoState = JSON.parse(raw);
      state.settings = upgradeSettings(state.settings, QUESTIONS);
      state.users ??= [];
      // Demo accounts always exist, even in browsers that saved older records.
      for (const u of DEFAULT_USERS)
        if (!state.users.some((x) => x.email === u.email))
          state.users.push(structuredClone(u));
      return state;
    }
    return {
      settings: {
        rules: structuredClone(DEFAULT_RULES),
        questions: structuredClone(QUESTIONS),
      },
      candidates: [],
      audit: [],
      users: structuredClone(DEFAULT_USERS),
    };
  }
  const iso = () => new Date(clock()).toISOString();
  const json = (data: unknown, status = 200) => Response.json(data, { status });
  return async (url: string, options: RequestInit = {}) => {
    try {
      const state = read();
      const cutoff = clock() - 180 * 86400000;
      const activeCandidates = state.candidates.filter(
        (c) => Date.parse(c.created) > cutoff,
      );
      const path = url.replace(/^\/api\//, "").split("/");
      const email = session();
      const user =
        state.users!.find((u) => u.email === email) ??
        // Older demo records and automated checks act as the Master Admin.
        (email ? null : state.users!.find((u) => u.role === "admin")!);
      const staff = path[0] !== "assessment" && path[0] !== "demo";
      if (staff && !user)
        return json({ error: "Sign in with a staff account first." }, 401);
      const can = (...roles: string[]) => !!user && roles.includes(user.role);
      const visible = (c: any) =>
        user?.role !== "manager" || c.manager === user.email;
      const input = options.body ? JSON.parse(String(options.body)) : {};
      const post = options.method === "POST";
      const audit = (action: string, record: string | null = null) =>
        state.audit.unshift({
          id: id(),
          actor: user ? `${user.name} (${STAFF_ROLES[user.role].label})` : "Candidate",
          action,
          record,
          created: iso(),
        });
      const save = () => storage.setItem(KEY, JSON.stringify(state));
      const fail = (message: string, status = 400) =>
        json({ error: message }, status);
      if (path[0] === "demo")
        return json({
          name: "Preview",
          status: "Invited",
          language: "en",
          practice: true,
          questions: safeQuestions(PRACTICE_QUESTIONS),
          listening: safeListening(PRACTICE_LISTENING),
          speaking: PRACTICE_SPEAKING,
          minutes: DEFAULT_RULES.minutes,
          started: null,
          answers: {},
          conversation: "",
          communication: null,
          revision: 0,
        });
      if (path[0] === "workspace")
        return json({
          ...state,
          candidates: activeCandidates.filter(visible),
          audit: can("admin", "hr") ? state.audit.slice(0, 80) : [],
          users: can("admin") ? state.users : state.users!.map(({ email, name, role }) => ({ email, name, role })),
          user,
        });
      if (path[0] === "users" && post) {
        if (!can("admin"))
          return fail("Only the Master Admin can manage user accounts.", 403);
        const target = String(input.email ?? "").trim().toLowerCase();
        if (!/^\S+@\S+\.\S+$/.test(target)) return fail("Enter a valid company email address.");
        if (input.remove) {
          if (target === user!.email) return fail("You cannot remove your own account.");
          state.users = state.users!.filter((u) => u.email !== target);
          audit("user.removed", target);
        } else {
          if (!(input.role in STAFF_ROLES) || !String(input.name ?? "").trim())
            return fail("Enter a name and choose a role.");
          const existing = state.users!.find((u) => u.email === target);
          if (existing) Object.assign(existing, { name: input.name.trim(), role: input.role });
          else state.users!.push({ email: target, name: input.name.trim(), role: input.role });
          audit(existing ? "user.updated" : "user.added", target);
        }
        save();
        return json({ ok: true });
      }
      if (path[0] === "candidates" && post && path.length === 1) {
        if (!can("admin", "hr"))
          return fail("Only HR or the Master Admin can send invitations.", 403);
        if (!input.name?.trim() || !/^\S+@\S+\.\S+$/.test(input.email ?? ""))
          return fail(
            "Enter a name and a valid email address. Use fictional details in this demo.",
          );
        const job = roleById(input.role);
        const blueprint = BLUEPRINTS[job.level];
        const manager = state.users!.find(
          (u) => u.email === input.manager && u.role === "manager",
        );
        const token = accessToken();
        const candidate = {
          id: id(),
          name: input.name,
          email: input.email,
          kind: input.kind,
          performance: input.performance,
          language: input.language,
          role: job.id,
          roleTitle: job.title,
          level: job.level,
          manager: manager?.email ?? null,
          managerName: manager?.name ?? null,
          invitedBy: user!.name,
          written: {},
          openMarks: {},
          flags: [],
          autoSubmitted: null,
          status: "Invited",
          created: iso(),
          expires: new Date(clock() + 7 * 86400000).toISOString(),
          started: null,
          submitted: null,
          accessToken: token,
          answers: {},
          conversation: "",
          communication: null,
          scores: [],
          review: null,
          decision: null,
          outcomes: [],
          switches: 0,
          revision: 0,
          assessment: {
            questions: chooseQuestions(state.settings.questions, null, {
              level: job.level,
              perCap: blueprint.perCap,
              open: blueprint.open,
            }),
            rules: {
              ...structuredClone(state.settings.rules),
              minutes: blueprint.minutes,
              maxWarnings:
                state.settings.rules.maxWarnings ?? DEFAULT_MAX_WARNINGS,
            },
            blueprint: { level: job.level, ...blueprint },
            listening: LISTENING,
            speaking: SPEAKING,
          },
        };
        state.candidates.unshift(candidate);
        audit("candidate.invited", candidate.id);
        save();
        return json({ id: candidate.id, path: "/assess/" + token });
      }
      if (path[0] === "assessment") {
        const candidate = state.candidates.find(
          (c) => c.accessToken === path[1],
        );
        if (!candidate)
          return fail(
            "This demo invitation belongs to another browser or has been cleared. Try the practice assessment from the Employee page.",
            404,
          );
        if (Date.parse(candidate.expires) <= clock())
          return fail("This demo invitation has expired.", 410);
        const complete = (reason: string | null = null) => {
          candidate.status = "Completed";
          candidate.submitted = iso();
          candidate.autoSubmitted = reason;
          candidate.scores = scoreAnswers(
            candidate.assessment.questions,
            candidate.answers,
            candidate.openMarks ?? {},
          );
          candidate.flags = integrityFlags(
            candidate.assessment.questions,
            candidate.answers,
          );
          audit("assessment.submitted", candidate.id);
          save();
        };
        if (
          candidate.status === "In progress" &&
          clock() >=
            Date.parse(candidate.started) +
              candidate.assessment.rules.minutes * 60000
        )
          complete("time limit");
        if (!post)
          return json({
            roleTitle: candidate.roleTitle ?? null,
            level: candidate.level ?? null,
            written: candidate.written ?? {},
            switches: candidate.switches ?? 0,
            maxWarnings:
              candidate.assessment.rules.maxWarnings ?? DEFAULT_MAX_WARNINGS,
            autoSubmitted: candidate.autoSubmitted ?? null,
            name: candidate.name,
            status: candidate.status,
            language: candidate.language,
            questions: safeQuestions(candidate.assessment.questions),
            listening: candidate.assessment.listening
              ? safeListening(candidate.assessment.listening)
              : null,
            speaking: candidate.assessment.speaking ?? null,
            minutes: candidate.assessment.rules.minutes,
            started: candidate.started,
            answers: candidate.answers,
            conversation: candidate.conversation,
            communication: candidate.communication ?? null,
            revision: candidate.revision,
          });
        if (path[2] === "start") {
          if (candidate.status !== "Invited")
            return fail("This assessment has already started.", 409);
          if (
            input.consent !== true ||
            !["en", "ms", "zh"].includes(input.language)
          )
            return fail("Choose a language and give consent first.");
          candidate.started = iso();
          candidate.status = "In progress";
          candidate.language = input.language;
          candidate.consent = iso();
          audit("assessment.started", candidate.id);
          save();
          return json({ ok: true });
        }
        if (candidate.status === "Completed")
          return json({ ok: true, status: "Completed" });
        if (candidate.status !== "In progress")
          return fail("Start the assessment first.");
        if (path[2] === "event") {
          candidate.switches++;
          const max =
            candidate.assessment.rules.maxWarnings ?? DEFAULT_MAX_WARNINGS;
          if (candidate.switches > max) {
            audit("assessment.auto-submitted", candidate.id);
            complete("tab switches");
            return json({ ok: true, switches: candidate.switches, max, status: "Completed" });
          }
          save();
          return json({ ok: true, switches: candidate.switches, max, status: candidate.status });
        }
        if (path[2] === "save" || path[2] === "submit") {
          if (input.revision !== candidate.revision)
            return fail(
              "Newer answers exist. Reload the assessment before continuing.",
              409,
            );
          const answers = input.answers ?? {};
          if (
            Object.entries(answers).some(
              ([key, value]) =>
                !candidate.assessment.questions.some(
                  (q: any) => q.id === key,
                ) ||
                !Number.isInteger(value) ||
                Number(value) < 0 ||
                Number(value) > 3,
            )
          )
            return fail("Invalid answer.");
          const written = input.written ?? {};
          if (
            typeof written !== "object" ||
            Object.entries(written).some(
              ([key, value]) =>
                !candidate.assessment.questions.some(
                  (q: any) => q.id === key && q.format === "open",
                ) ||
                typeof value !== "string" ||
                value.length > 6000,
            )
          )
            return fail("Invalid written answer.");
          if (
            typeof input.conversation !== "string" ||
            input.conversation.length > 6000
          )
            return fail("Keep your conversation under 6,000 characters.");
          const comm = input.communication ?? null;
          const listening = candidate.assessment.listening;
          if (
            comm &&
            (!["voice", "typed"].includes(comm.mode) ||
              typeof comm.listening?.answers !== "object" ||
              Object.entries(comm.listening.answers).some(
                ([key, value]) =>
                  !listening?.questions.some((q: any) => q.id === key) ||
                  !Number.isInteger(value) ||
                  Number(value) < 0 ||
                  Number(value) > 3,
              ))
          )
            return fail("Invalid answer.");
          if (
            path[2] === "submit" &&
            (!candidate.assessment.questions.every((q: any) =>
              q.format === "open"
                ? String(written[q.id] ?? "").trim().length >= 20
                : answers[q.id] !== undefined,
            ) ||
              (listening &&
                !listening.questions.every(
                  (q: any) => comm?.listening.answers[q.id] !== undefined,
                )) ||
              (input.conversation.trim().length < 20 &&
                !(
                  comm?.mode === "voice" &&
                  (comm.metrics?.durationSec ?? 0) >= 10
                )))
          )
            return fail(
              "Complete every question and give your customer reply before submitting.",
            );
          candidate.answers = answers;
          candidate.written = written;
          candidate.conversation = input.conversation;
          candidate.communication = comm;
          candidate.revision++;
          if (path[2] === "submit") complete();
          else save();
          return json({
            ok: true,
            status: candidate.status,
            revision: candidate.revision,
          });
        }
      }
      if (path[0] === "candidates" && post) {
        const candidate = state.candidates.find((c) => c.id === path[1]);
        if (!candidate || !visible(candidate))
          return fail("Candidate not found.", 404);
        if (
          !can("admin", "hr") &&
          !["review", "decision", "open-review"].includes(path[2])
        )
          return fail("Hiring managers can review and decide only.", 403);
        if (path[2] === "reissue") {
          if (candidate.status === "Completed")
            return fail("Completed assessments cannot be reopened.");
          Object.assign(candidate, {
            accessToken: accessToken(),
            status: "Invited",
            started: null,
            answers: {},
            conversation: "",
            communication: null,
            revision: 0,
            switches: 0,
            written: {},
            autoSubmitted: null,
            expires: new Date(clock() + 7 * 86400000).toISOString(),
          });
          audit("invitation.reissued", candidate.id);
          save();
          return json({ path: "/assess/" + candidate.accessToken });
        }
        if (candidate.status !== "Completed")
          return fail("Complete the assessment before reviewing it.");
        if (path[2] === "review") {
          if (
            !Array.isArray(input.ratings) ||
            input.ratings.length !== 4 ||
            input.ratings.some(
              (n: number) => !Number.isInteger(n) || n < 0 || n > 4,
            ) ||
            typeof input.notes !== "string" ||
            input.notes.trim().length < 10
          )
            return fail(
              "Complete the four rubric ratings and add evidence notes.",
            );
          const d = input.delivery;
          if (
            d !== undefined &&
            (![d.clarity, d.pace, d.fluency].every(Number.isInteger) ||
              d.clarity < 0 ||
              d.clarity > 4 ||
              d.pace < 0 ||
              d.pace > 10 ||
              d.fluency < 0 ||
              d.fluency > 10)
          )
            return fail("Check the delivery marks.");
          candidate.review = {
            ...input,
            score: Math.round(
              (input.ratings.reduce((a: number, b: number) => a + b, 0) / 16) *
                100,
            ),
            rubric: RUBRIC,
            by: user!.name,
            at: iso(),
            method: "human-rubric",
            ai: input.ai ?? null,
          };
        } else if (path[2] === "open-review") {
          const marks = input.marks ?? {};
          if (
            Object.entries(marks).some(
              ([key, value]) =>
                !candidate.assessment.questions.some(
                  (q: any) => q.id === key && q.format === "open",
                ) || ![0, 50, 100].includes(Number(value)),
            )
          )
            return fail("Mark each open-ended answer Full, Partial or No credit.");
          candidate.openMarks = { ...(candidate.openMarks ?? {}), ...marks };
          candidate.scores = scoreAnswers(
            candidate.assessment.questions,
            candidate.answers,
            candidate.openMarks,
          );
        } else if (path[2] === "decision") {
          if (
            !["Interview", "Hold", "Hire", "Do not proceed"].includes(
              input.decision,
            ) ||
            typeof input.reason !== "string" ||
            input.reason.trim().length < 10
          )
            return fail(
              "Choose a decision and record at least 10 characters of reasons.",
            );
          candidate.decision = { ...input, by: user!.name, at: iso() };
        } else if (path[2] === "outcome") {
          if (candidate.decision?.decision !== "Hire")
            return fail("Record a Hire decision first.");
          if (
            ![3, 6].includes(input.month) ||
            typeof input.retained !== "boolean" ||
            !Number.isFinite(input.salesKpi) ||
            input.salesKpi < 0 ||
            input.salesKpi > 1000
          )
            return fail("Check the follow-up values.");
          candidate.outcomes = [
            ...candidate.outcomes.filter((o: any) => o.month !== input.month),
            { ...input, by: user!.name, at: iso() },
          ];
        } else return fail("Action not found.", 404);
        audit(path[2] + ".recorded", candidate.id);
        save();
        return json({ ok: true });
      }
      if (path[0] === "settings" && post) {
        if (!can("admin", "hr"))
          return fail("Only HR or the Master Admin can change settings.", 403);
        if (
          (input.rules?.maxWarnings !== undefined &&
            (!Number.isInteger(input.rules.maxWarnings) ||
              input.rules.maxWarnings < 0 ||
              input.rules.maxWarnings > 5)) ||
          !input.rules ||
          !Array.isArray(input.questions) ||
          input.rules.proficient < 1 ||
          input.rules.strong > 100 ||
          input.rules.strong <= input.rules.proficient ||
          input.rules.minutes < 5 ||
          input.rules.minutes > 90
        )
          return fail("Check the scoring thresholds and time limit.");
        if (
          !CAPS.every(
            (_, cap) =>
              input.questions.filter(
                (q: any) => q.cap === cap && q.enabled && q.format !== "open",
              ).length >= 2,
          )
        )
          return fail("Keep at least two active questions per capability.");
        input.rules.version = state.settings.rules.version + 1;
        state.settings = input;
        audit("assessment.settings.updated");
        save();
        return json({ ok: true });
      }
      if (path[0] === "export" && post) {
        const rows = [
          [
            "Name",
            "Email",
            "Type",
            "Job role",
            "Job level",
            "Hiring manager",
            "Language",
            "Status",
            ...CAPS,
            "Weighted score",
            "Integrity flags",
            "Tab switches",
            "Conversation review",
            ...COMMUNICATION_COLUMNS,
            "Decision",
            "Reason",
          ],
          ...activeCandidates.filter(visible).map((c) => [
            c.name,
            c.email,
            c.kind,
            c.roleTitle ?? "",
            c.level ?? "",
            c.managerName ?? "",
            LANGS[c.language as keyof typeof LANGS],
            c.status,
            ...(c.scores.length ? c.scores : Array(6).fill("")),
            c.scores.length ? Math.round(weightedScore(c.scores, c.level)) : "",
            (c.flags ?? []).map((f: any) => `${f.id} ${f.severity}`).join("; "),
            c.switches ?? 0,
            c.review?.score ?? "Pending",
            ...communicationCells(c),
            c.decision?.decision ?? "",
            c.decision?.reason ?? "",
          ]),
        ];
        audit("candidates.exported");
        save();
        return new Response(
          "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n"),
          { headers: { "Content-Type": "text/csv; charset=utf-8" } },
        );
      }
      if (path[0] === "purge" && post) {
        if (!can("admin"))
          return fail("Only the Master Admin can purge records.", 403);
        const previous = state.candidates.length;
        const cutoff = clock() - 180 * 86400000;
        state.candidates = state.candidates.filter(
          (c) => Date.parse(c.created) > cutoff,
        );
        state.audit = state.audit.filter((a) => Date.parse(a.created) > cutoff);
        audit("retention.purged");
        save();
        return json({ ok: true, count: previous - state.candidates.length });
      }
      return fail("Action not found.", 404);
    } catch {
      return json(
        {
          error:
            "Demo data could not be saved. Enable browser storage or free up space, then try again.",
        },
        503,
      );
    }
  };
}

export function demoFetch(path: string, options?: RequestInit) {
  return createDemoTransport({
    getItem: (key) => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
  })(path, options);
}
