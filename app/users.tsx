import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { STAFF_ROLES } from "@/lib/client-config";
import { api, Picker } from "./panels";

/** Master Admin only: add, change and remove staff accounts. */
export function UsersPanel({ workspace: w, onUpdate }: any) {
  const [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [role, setRole] = useState("manager"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function send(body: any, message: string) {
    setBusy(true);
    setError("");
    try {
      await api("users", body);
      await onUpdate();
      toast.success(message);
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel padded">
      <div className="panel-heading">
        <div>
          <div className="eyebrow">MASTER ADMIN</div>
          <h2>Users and access</h2>
          <p className="muted">
            Each person signs in with their own company email. Hiring Managers
            only see the candidates assigned to them.
          </p>
        </div>
      </div>
      <div className="role-summary">
        {Object.entries(STAFF_ROLES).map(([key, r]) => (
          <div key={key} className="panel padded">
            <span className={"role-pill role-" + key}>{r.label}</span>
            <p className="muted">{r.note}</p>
            <strong>
              {w.users.filter((u: any) => u.role === key).length} account
              {w.users.filter((u: any) => u.role === key).length === 1
                ? ""
                : "s"}
            </strong>
          </div>
        ))}
      </div>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Company email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Assigned candidates</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {w.users.map((u: any) => (
            <TableRow key={u.email}>
              <TableCell>
                <strong>{u.name}</strong>
                {u.email === w.user.email && (
                  <small className="muted"> (you)</small>
                )}
              </TableCell>
              <TableCell className="muted">{u.email}</TableCell>
              <TableCell>
                <Picker
                  label={"Role for " + u.name}
                  value={u.role}
                  onChange={(v: string) =>
                    send({ ...u, role: v }, "Role updated")
                  }
                  items={Object.entries(STAFF_ROLES).map(([k, r]) => [
                    k,
                    r.label,
                  ])}
                />
              </TableCell>
              <TableCell>
                {u.role === "manager"
                  ? w.candidates.filter((c: any) => c.manager === u.email)
                      .length
                  : "All"}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  disabled={busy || u.email === w.user.email}
                  onClick={() =>
                    send({ email: u.email, remove: true }, "Account removed")
                  }
                >
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <h3 className="section-title">Add a user</h3>
      <form
        className="user-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await send({ name, email, role }, "User added")) {
            setName("");
            setEmail("");
          }
        }}
      >
        <label className="form-label">
          Full name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Nurul Huda"
          />
        </label>
        <label className="form-label">
          Company email
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
          />
        </label>
        <label className="form-label">Role</label>
        <Picker
          label="New user role"
          value={role}
          onChange={setRole}
          items={Object.entries(STAFF_ROLES).map(([k, r]) => [k, r.label])}
        />
        <Button disabled={busy}>Add user</Button>
      </form>
      <div className="notice">
        Demo accounts are stored in this browser. In production, users sign in
        with Microsoft 365 and roles map to the client's user groups (pending
        the IT team's hosting decision).
      </div>
    </section>
  );
}
