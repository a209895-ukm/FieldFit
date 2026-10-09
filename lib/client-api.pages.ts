import { demoFetch } from "./demo-api";

export async function apiFetch(
  path: string,
  options?: RequestInit,
): Promise<Response> {
  return demoFetch(path, options);
}
