import type { IncomingMessage, ServerResponse } from "node:http";
import { handle } from "./api.js";

export function apiMiddleware(origin: string) {
  return async (
    incoming: IncomingMessage,
    outgoing: ServerResponse,
    next?: () => void,
  ) => {
    const path = incoming.url?.split("?")[0] ?? "/";
    if (!path.startsWith("/api/")) {
      next?.();
      return;
    }
    try {
      const headers = new Headers();
      for (const [key, value] of Object.entries(incoming.headers)) {
        if (value)
          headers.set(key, Array.isArray(value) ? value.join(", ") : value);
      }
      const method = incoming.method ?? "GET";
      if (!["GET", "POST"].includes(method)) {
        outgoing.writeHead(405, { Allow: "GET, POST" });
        outgoing.end();
        return;
      }
      const chunks: Buffer[] = [];
      let bytes = 0;
      // Voice recordings are binary and larger; every other request is small JSON.
      const binary =
        method === "POST" &&
        /^\/api\/assessment\/[a-f0-9]{64}\/audio$/.test(path);
      const limit = binary ? 6_000_000 : 150000;
      for await (const chunk of incoming) {
        bytes += chunk.length;
        if (bytes > limit) {
          outgoing.writeHead(413, { "Content-Type": "application/json" });
          outgoing.end(JSON.stringify({ error: "Request is too large." }));
          return;
        }
        chunks.push(Buffer.from(chunk));
      }
      const request = new Request(new URL(incoming.url ?? "/", origin), {
        method,
        headers,
        ...(method === "POST"
          ? {
              body: binary
                ? new Uint8Array(Buffer.concat(chunks))
                : Buffer.concat(chunks).toString("utf8"),
            }
          : {}),
      });
      const response = await handle(request);
      outgoing.statusCode = response.status;
      response.headers.forEach((value, key) => outgoing.setHeader(key, value));
      outgoing.setHeader("X-Content-Type-Options", "nosniff");
      outgoing.setHeader("Referrer-Policy", "no-referrer");
      outgoing.end(Buffer.from(await response.arrayBuffer()));
    } catch (error) {
      console.error("API request failed", error);
      if (!outgoing.headersSent)
        outgoing.writeHead(500, { "Content-Type": "application/json" });
      outgoing.end(
        JSON.stringify({
          error: "Unable to complete the request. Please retry.",
        }),
      );
    }
  };
}
