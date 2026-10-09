import { database } from "./database.js";
import {
  DEFAULT_RULES,
  chooseQuestions,
  scoreAnswers,
} from "../lib/assessment.js";
import { QUESTIONS } from "../lib/question-bank.js";
export const db = () => database;
export const now = () => new Date().toISOString();
export const uid = () => crypto.randomUUID();
export const token = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
export async function hash(s: string) {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)),
    ),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
}
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function requireThat(
  condition: unknown,
  status: number,
  message: string,
): asserts condition {
  if (!condition) throw new HttpError(status, message);
}
/** A workspace belongs to this browser's opaque cookie, never a shared demo account. */
export async function actor(req: Request, create = false) {
  const cookie = (req.headers.get("cookie") ?? "")
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("fieldfit_workspace="))
    ?.slice("fieldfit_workspace=".length);
  const valid = cookie && /^[a-f0-9]{64}$/.test(cookie);
  let workspace: any = valid
    ? await db()
        .prepare("SELECT * FROM workspaces WHERE owner=?")
        .bind(await hash(cookie))
        .first()
    : null;
  let setCookie: string | undefined;
  if (!workspace) {
    requireThat(
      create,
      401,
      "Open your FieldFit workspace in this browser before continuing.",
    );
    const key = token();
    const id = uid();
    await db()
      .prepare(
        "INSERT INTO workspaces(id,owner,settings,created) VALUES(?,?,?,?)",
      )
      .bind(
        id,
        await hash(key),
        JSON.stringify({ rules: DEFAULT_RULES, questions: QUESTIONS }),
        now(),
      )
      .run();
    workspace = await db()
      .prepare("SELECT * FROM workspaces WHERE id=?")
      .bind(id)
      .first();
    setCookie =
      "fieldfit_workspace=" +
      key +
      "; HttpOnly; SameSite=Strict; Path=/api; Max-Age=15552000" +
      (new URL(req.url).protocol === "https:" ? "; Secure" : "");
  }
  return {
    workspace,
    role: "admin",
    user: {
      userId: workspace.id,
      displayName: "Hiring team",
      email: "Workspace administrator",
    },
    settings: JSON.parse(workspace.settings),
    setCookie,
  };
}
export function auditStmt(
  workspace: string,
  actor: string,
  action: string,
  record: string | null,
  detail: any = {},
) {
  return db()
    .prepare(
      "INSERT INTO audit(id,workspace,actor,action,record,detail,created) VALUES(?,?,?,?,?,?,?)",
    )
    .bind(
      uid(),
      workspace,
      actor,
      action,
      record,
      JSON.stringify(detail),
      now(),
    );
}
export const log = async (
  w: string,
  a: string,
  event: string,
  r: string | null,
  detail: any = {},
) => db().batch([auditStmt(w, a, event, r, detail)]);
export async function owned(id: string, a: Awaited<ReturnType<typeof actor>>) {
  const c: any = await db()
    .prepare("SELECT * FROM candidates WHERE id=? AND workspace=?")
    .bind(id, a.workspace.id)
    .first();
  requireThat(c, 404, "Candidate not found.");
  return c;
}
export function candidateView(c: any) {
  const { token_hash, session_hash, snapshot, ...safe } = c;
  return {
    ...safe,
    answers: JSON.parse(c.answers),
    scores: c.scores ? JSON.parse(c.scores) : [],
    review: c.review ? JSON.parse(c.review) : null,
    decision: c.decision ? JSON.parse(c.decision) : null,
    outcomes: JSON.parse(c.outcomes),
    assessment: JSON.parse(snapshot),
  };
}
export function safeQuestions(qs: any[]) {
  return qs.map(({ points, explanation, ...q }) => q);
}
export async function finish(c: any) {
  if (c.status === "Completed") return c;
  const snap = JSON.parse(c.snapshot);
  const scores = scoreAnswers(snap.questions, JSON.parse(c.answers));
  await db().batch([
    db()
      .prepare(
        "UPDATE candidates SET status='Completed',scores=?,submitted=? WHERE id=? AND status='In progress'",
      )
      .bind(JSON.stringify(scores), now(), c.id),
    auditStmt(c.workspace, "candidate", "assessment.submitted", c.id, {
      scoringVersion: snap.rules.version,
    }),
  ]);
  return db().prepare("SELECT * FROM candidates WHERE id=?").bind(c.id).first();
}
export async function candidateAccess(
  raw: string,
  req: Request,
  allowUnclaimed = false,
) {
  requireThat(
    /^[a-f0-9]{64}$/.test(raw),
    404,
    "This assessment link is not valid.",
  );
  const c: any = await db()
    .prepare("SELECT * FROM candidates WHERE token_hash=?")
    .bind(await hash(raw))
    .first();
  requireThat(c, 404, "This assessment link is not valid.");
  requireThat(
    Date.parse(c.expires) > Date.now(),
    410,
    "This invitation has expired. Please contact your hiring team.",
  );
  if (c.session_hash) {
    const cookie = (req.headers.get("cookie") ?? "")
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("ff_" + c.id + "="))
      ?.split("=")[1];
    requireThat(
      cookie && (await hash(cookie)) === c.session_hash,
      403,
      "This invitation has already been opened on another browser. Use the browser where you started.",
    );
  } else requireThat(allowUnclaimed, 403, "Start the assessment first.");
  return c;
}
