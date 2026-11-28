import { useState } from "react";
import { HiringRules } from "./hiring-rules";
import { Availability, AssessmentSettings, BenchmarkStaff, DataAudit } from "./staff-pages";
import { UsersPanel } from "./users";

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
        {tab === "availability" && <Availability candidates={candidates} />}
        {tab === "assessment" && (
          <AssessmentSettings key={workspace.settings.rules.version} workspace={workspace} onUpdate={onUpdate} />
        )}
        {tab === "benchmark" && <BenchmarkStaff candidates={workspace.candidates ?? []} onInvite={onInvite} />}
        {tab === "users" && admin && (
          <UsersPanel workspace={workspace} onUpdate={onUpdate} />
        )}
        {tab === "data" && admin && <DataAudit workspace={workspace} onUpdate={onUpdate} />}
      </div>
    </div>
  );
}

