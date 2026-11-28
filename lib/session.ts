import type { StaffRole } from "./client-config";

export type StaffUser = { email: string; name: string; role: StaffRole };
export const SESSION_KEY = "fieldfit-pages-session-v1";

/** Demo accounts. In production these become company Microsoft 365 accounts. */
export const DEFAULT_USERS: StaffUser[] = [
  { email: "admin@company.example", name: "Demo Master Admin", role: "admin" },
  { email: "hr@company.example", name: "Demo HR Officer", role: "hr" },
  { email: "manager@company.example", name: "Demo Hiring Manager", role: "manager" },
];

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const store = (): Store | null =>
  typeof window === "undefined" ? null : window.localStorage;

export function sessionEmail(s: Store | null = store()) {
  try {
    return s?.getItem(SESSION_KEY) ?? null;
  } catch {
    return null;
  }
}
export function setSessionEmail(email: string | null, s: Store | null = store()) {
  try {
    if (email) s?.setItem(SESSION_KEY, email.toLowerCase());
    else s?.removeItem(SESSION_KEY);
  } catch {
    /* storage unavailable */
  }
}
