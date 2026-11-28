import { useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { STAFF_ROLES, type StaffRole } from "@/lib/client-config";
import { api } from "./panels";

const ROLES = Object.keys(STAFF_ROLES) as StaffRole[];

/** Master Admin: staff accounts and roles. */
export function UsersPanel({ workspace: w, onUpdate }: any) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | StaffRole>("all");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<any>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "manager" as StaffRole });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function send(body: any, message: string, undo?: any) {
    setBusy(true);
    try {
      await api("users", body);
      await onUpdate();
      toast.success(message, undo && {
        action: {
          label: "Undo",
          onClick: async () => {
            await api("users", undo);
            await onUpdate();
            toast("Change undone");
          },
        },
      });
      return true;
    } catch (e: any) {
      toast.error(e.message);
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  const users = w.users.filter(
    (u: any) =>
      (filter === "all" || u.role === filter) &&
      (u.name + " " + u.email).toLowerCase().includes(query.toLowerCase()),
  );
  const count = (r: StaffRole) => w.users.filter((u: any) => u.role === r).length;
  const assigned = (email: string) =>
    w.candidates.filter((c: any) => c.manager === email).length;

  return (
    <section className="users">
      <div className="users-bar">
        <label className="qb-search">
          <Search size={15} />
          <input placeholder="Search name or email" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <div className="seg" role="tablist" aria-label="Role">
          <button className={filter === "all" ? "on" : ""} onClick={() => setFilter("all")}>
            All <span>{w.users.length}</span>
          </button>
          {ROLES.map((r) => (
            <button key={r} className={filter === r ? "on" : ""} onClick={() => setFilter(r)}>
              {STAFF_ROLES[r].label} <span>{count(r)}</span>
            </button>
          ))}
        </div>
        <Button onClick={() => { setForm({ name: "", email: "", role: "manager" }); setError(""); setAdding(true); }}>
          <Plus size={15} /> Add user
        </Button>
      </div>

      <div className="users-table">
        {users.map((u: any) => {
          const me = u.email === w.user.email;
          return (
            <div className="users-row" key={u.email}>
              <span className="avatar">{u.name.split(" ").map((s: string) => s[0]).slice(0, 2).join("")}</span>
              <div className="users-who">
                <strong>{u.name}{me && <em>You</em>}</strong>
                <small>{u.email}</small>
              </div>
              <span className="users-meta">
                {u.role === "manager" ? `${assigned(u.email)} assigned` : ""}
              </span>
              <select
                className={"role-select role-" + u.role}
                value={u.role}
                disabled={me || busy}
                aria-label={"Role for " + u.name}
                title={me ? "You can’t change your own role" : undefined}
                onChange={(e) =>
                  send(
                    { email: u.email, name: u.name, role: e.target.value },
                    `${u.name} is now ${STAFF_ROLES[e.target.value as StaffRole].label}`,
                    { email: u.email, name: u.name, role: u.role },
                  )
                }
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{STAFF_ROLES[r].label}</option>
                ))}
              </select>
              <button
                className="icon-btn"
                aria-label={"Remove " + u.name}
                disabled={me || busy}
                onClick={() => setRemoving(u)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          );
        })}
        {!users.length && <p className="qb-empty">No users match.</p>}
      </div>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="users-dialog">
          <DialogHeader>
            <DialogTitle>Add user</DialogTitle>
          </DialogHeader>
          <form
            className="users-form"
            onSubmit={async (e) => {
              e.preventDefault();
              if (w.users.some((u: any) => u.email === form.email.trim().toLowerCase()))
                return setError("This email already has an account.");
              if (await send(form, `${form.name} added`)) setAdding(false);
            }}
          >
            <input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input required type="email" placeholder="Company email" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); setError(""); }} />
            <div className="chip-row">
              {ROLES.map((r) => (
                <button type="button" key={r} className={form.role === r ? "on" : ""} onClick={() => setForm({ ...form, role: r })}>
                  {STAFF_ROLES[r].label}
                </button>
              ))}
            </div>
            <small className="muted">{STAFF_ROLES[form.role].note}</small>
            {error && <small className="warn-text">{error}</small>}
            <Button disabled={busy}>Add user</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!removing} onOpenChange={(v) => !v && setRemoving(null)}>
        <DialogContent className="users-dialog">
          <DialogHeader>
            <DialogTitle>Remove {removing?.name}?</DialogTitle>
          </DialogHeader>
          <p className="muted small">
            They lose access immediately.
            {removing?.role === "manager" && assigned(removing.email) > 0 &&
              ` Their ${assigned(removing.email)} assigned candidates stay in the system and can be reassigned.`}
          </p>
          <div className="confirm-actions">
            <Button variant="outline" onClick={() => setRemoving(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                const u = removing;
                setRemoving(null);
                await send({ email: u.email, remove: true }, `${u.name} removed`, { email: u.email, name: u.name, role: u.role });
              }}
            >
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
