import { STATIC_DEMO } from "./navigation";

/**
 * Voice replies. The Node.js version uploads them to the server; the GitHub Pages
 * demo keeps them in this browser's IndexedDB, next to its local records.
 */
const DB = "fieldfit-audio";
const STORE = "clips";
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function local<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const request = run(db.transaction(STORE, mode).objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export const audioType = (blob: Blob) =>
  (blob.type || "audio/webm").split(";")[0];

export async function saveAudio(token: string, blob: Blob) {
  const type = audioType(blob);
  if (STATIC_DEMO) {
    const id = crypto.randomUUID();
    await local("readwrite", (s) => s.put(blob, id));
    return { id, type };
  }
  const res = await fetch("/api/assessment/" + token + "/audio", {
    method: "POST",
    headers: { "Content-Type": type },
    body: blob,
  });
  const data = await res.json();
  if (!res.ok) throw Error(data.error ?? "The recording could not be saved.");
  return data as { id: string; type: string };
}

/** A playable URL for a candidate's stored reply, or null if none is available here. */
export async function audioUrl(candidate: any): Promise<string | null> {
  const ref = candidate.communication?.audio;
  if (!ref) return null;
  if (!STATIC_DEMO) return "/api/candidates/" + candidate.id + "/audio";
  try {
    const blob = await local<Blob | undefined>("readonly", (s) =>
      s.get(ref.id),
    );
    return blob ? URL.createObjectURL(blob) : null;
  } catch {
    return null;
  }
}

export async function removeAudio(candidate: any) {
  const ref = candidate.communication?.audio;
  if (!STATIC_DEMO || !ref) return;
  try {
    await local("readwrite", (s) => s.delete(ref.id));
  } catch {}
}
