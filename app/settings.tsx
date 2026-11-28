import { useState } from "react";
import { Approvals } from "./approvals";
import { HiringRules } from "./hiring-rules";
import { Admin, Benchmarks } from "./panels";
import { UsersPanel } from "./users";
import { BLUEPRINTS, JOB_ROLES, LEVELS, WEIGHTS } from "@/lib/client-config";

const TABS = [
  ["hiring", "Hiring rules"],
  ["availability", "Interview availability"],
  ["assessment", "Assessment"],
  ["benchmark", "Benchmark staff"],
  ["users", "Users & access"],
  ["data", "Data & audit"],
] as const;

/** One place for configuration. Users and Data are Master Admin only. */
export function Settings({ workspace, candidates, onUpdate, onInvite, onProfile, initialTab }: any) {
  const admin = workspace.user?.role === "admin";
  const tabs = TABS.filter(([id]) => admin || !["users", "data"].includes(id));
  const [tab, setTab] = useState<string>(initialTab ?? "hiring");
  return (
    <div className="settings">
      <nav className="settings-tabs" role="tablist">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="settings-body">
        {tab === "hiring" && <HiringRules candidates={candidates} />}
        {tab === "availability" && (
          <Approvals
            mode="setup"
            part="availability"
            candidates={candidates}
            sample={false}
            onProfile={onProfile}
            onInvite={onInvite}
          />
        )}
        {tab === "assessment" && (
          <>
            <JobRoles questions={workspace.settings?.questions ?? []} />
            <Admin
              key={workspace.settings.rules.version}
              workspace={workspace}
              onUpdate={onUpdate}
              section="rules"
            />
          </>
        )}
        {tab === "benchmark" && (
          <Benchmarks candidates={workspace.candidates ?? []} onInvite={onInvite} />
        )}
        {tab === "users" && admin && (
          <UsersPanel workspace={workspace} onUpdate={onUpdate} />
        )}
        {tab === "data" && admin && (
          <>
            <Admin workspace={workspace} onUpdate={onUpdate} section="team" />
            <Admin workspace={workspace} onUpdate={onUpdate} section="audit" />
          </>
        )}
      </div>
    </div>
  );
}

function JobRoles({ questions }: { questions: any[] }) {
  return (
    <section className="settings-card">
      <h2>Job roles and test length</h2>
      <table className="dash-table settings-table">
        <thead>
          <tr>
            <th>Level</th>
            <th>Job roles</th>
            <th>Assessment</th>
            <th>Weights NUM / LOG / SJT / PS / SLR / DDL</th>
            <th>Bank</th>
          </tr>
        </thead>
        <tbody>
          {LEVELS.map((level) => {
            const bp = BLUEPRINTS[level];
            const own = (cap: number) =>
              questions.filter(
                (q) => q.enabled && q.cap === cap && q.format !== "open" && q.level === level,
              ).length;
            const have = bp.perCap.reduce((n, want, cap) => n + Math.min(want, own(cap)), 0);
            const want = bp.perCap.reduce((a, b) => a + b, 0);
            return (
              <tr key={level}>
                <td><strong>{level}</strong></td>
                <td>
                  {JOB_ROLES.filter((r) => r.level === level)
                    .map((r) => r.title.split(" (")[0])
                    .join(", ")}
                </td>
                <td>{bp.note}</td>
                <td>{WEIGHTS[level].map((w) => Math.round(w * 100) + "%").join(" / ")}</td>
                <td>
                  <span className={"stage " + (have < want ? "stage-warn" : "stage-good")}>
                    {have}/{want}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="muted small">
        Bank shows level-specific questions available. Until the full bank is imported, tests are topped up with general items.
      </p>
    </section>
  );
}
