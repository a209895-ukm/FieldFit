import {
  CAPS,
  LANGS,
  DEFAULT_RULES,
  RUBRIC,
  chooseQuestions,
  scoreAnswers,
  csvCell,
} from "./assessment.ts";
import { QUESTIONS } from "./question-bank.ts";

const KEY = "fieldfit-pages-demo-v1";
type DemoState = {
  settings: { rules: typeof DEFAULT_RULES; questions: typeof QUESTIONS };
  candidates: any[];
  audit: any[];
};
const id = () => crypto.randomUUID();
const accessToken = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(32)), (n) =>
    n.toString(16).padStart(2, "0"),
  ).join("");
const safeQuestions = (questions: typeof QUESTIONS) =>
  questions.map(({ points, explanation, ...question }) => question);

/** GitHub Pages sandbox. All state is local to this browser; no records are sent to a server. */
export function createDemoTransport(
  storage: Pick<Storage, "getItem" | "setItem">,
  clock = Date.now,
) {
  function read(): DemoState {
    const raw = storage.getItem(KEY);
    return raw
      ? JSON.parse(raw)
      : {
          settings: {
            rules: structuredClone(DEFAULT_RULES),
            questions: structuredClone(QUESTIONS),
          },
          candidates: [],
          audit: [],
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
      const input = options.body ? JSON.parse(String(options.body)) : {};
      const post = options.method === "POST";
      const audit = (action: string, record: string | null = null) =>
        state.audit.unshift({
          id: id(),
          actor: "Demo employer",
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
          questions: safeQuestions(
            CAPS.flatMap((_, cap) =>
              QUESTIONS.filter((q) => q.cap === cap).slice(0, 2),
            ),
          ),
          minutes: 40,
          started: null,
          answers: {},
          conversation: "",
          revision: 0,
        });
      if (path[0] === "workspace")
        return json({
          ...state,
          candidates: activeCandidates,
          audit: state.audit.slice(0, 80),
          user: { name: "Demo employer", role: "admin" },
        });
      if (path[0] === "candidates" && post && path.length === 1) {
        if (!input.name?.trim() || !/^\S+@\S+\.\S+$/.test(input.email ?? ""))
          return fail(
            "Enter a name and a valid email address. Use fictional details in this demo.",
          );
        const token = accessToken();
        const candidate = {
          id: id(),
          name: input.name,
          email: input.email,
          kind: input.kind,
          performance: input.performance,
          language: input.language,
          status: "Invited",
          created: iso(),
          expires: new Date(clock() + 7 * 86400000).toISOString(),
          started: null,
          submitted: null,
          accessToken: token,
          answers: {},
          conversation: "",
          scores: [],
          review: null,
          decision: null,
          outcomes: [],
          switches: 0,
          revision: 0,
          assessment: {
            questions: chooseQuestions(state.settings.questions),
            rules: structuredClone(state.settings.rules),
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
        const complete = () => {
          candidate.status = "Completed";
          candidate.submitted = iso();
          candidate.scores = scoreAnswers(
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
          complete();
        if (!post)
          return json({
            name: candidate.name,
            status: candidate.status,
            language: candidate.language,
            questions: safeQuestions(candidate.assessment.questions),
            minutes: candidate.assessment.rules.minutes,
            started: candidate.started,
            answers: candidate.answers,
            conversation: candidate.conversation,
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
          save();
          return json({ ok: true });
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
          if (
            typeof input.conversation !== "string" ||
            input.conversation.length > 6000
          )
            return fail("Keep your conversation under 6,000 characters.");
          if (
            path[2] === "submit" &&
            (!candidate.assessment.questions.every(
              (q: any) => answers[q.id] !== undefined,
            ) ||
              input.conversation.trim().length < 20)
          )
            return fail(
              "Complete every question and write at least 20 characters.",
            );
          candidate.answers = answers;
          candidate.conversation = input.conversation;
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
        if (!candidate) return fail("Candidate not found.", 404);
        if (path[2] === "reissue") {
          if (candidate.status === "Completed")
            return fail("Completed assessments cannot be reopened.");
          Object.assign(candidate, {
            accessToken: accessToken(),
            status: "Invited",
            started: null,
            answers: {},
            conversation: "",
            revision: 0,
            switches: 0,
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
          candidate.review = {
            ...input,
            score: Math.round(
              (input.ratings.reduce((a: number, b: number) => a + b, 0) / 16) *
                100,
            ),
            rubric: RUBRIC,
            by: "Demo employer",
            at: iso(),
            method: "human-rubric",
          };
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
          candidate.decision = { ...input, by: "Demo employer", at: iso() };
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
            { ...input, by: "Demo employer", at: iso() },
          ];
        } else return fail("Action not found.", 404);
        audit(path[2] + ".recorded", candidate.id);
        save();
        return json({ ok: true });
      }
      if (path[0] === "settings" && post) {
        if (
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
              input.questions.filter((q: any) => q.cap === cap && q.enabled)
                .length >= 2,
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
            "Language",
            "Status",
            ...CAPS,
            "Conversation review",
            "Decision",
            "Reason",
          ],
          ...activeCandidates.map((c) => [
            c.name,
            c.email,
            c.kind,
            LANGS[c.language as keyof typeof LANGS],
            c.status,
            ...(c.scores.length ? c.scores : Array(6).fill("")),
            c.review?.score ?? "Pending",
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
