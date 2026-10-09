import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";
import { apiMiddleware } from "./http.js";

const host = process.env.HOST ?? "127.0.0.1";
const port = Number(process.env.PORT ?? 5173);
const origin = new URL(process.env.PUBLIC_ORIGIN ?? `http://127.0.0.1:${port}`)
  .origin;
const root = resolve("dist/client");
const types: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".json": "application/json",
};
const api = apiMiddleware(origin);
createServer(async (req, res) => {
  if (req.url?.startsWith("/api/")) {
    await api(req, res);
    return;
  }
  if (!["GET", "HEAD"].includes(req.method ?? "GET")) {
    res.writeHead(405);
    res.end();
    return;
  }
  try {
    const path = decodeURIComponent(new URL(req.url ?? "/", origin).pathname);
    let file = resolve(root, "." + path);
    if (!file.startsWith(root + sep) && file !== root) {
      res.writeHead(403);
      res.end();
      return;
    }
    let exists = false;
    try {
      exists = (await stat(file)).isFile();
    } catch {}
    if (!exists) {
      if (path !== "/" && !/^\/assess\/(demo|[a-f0-9]{64})\/?$/.test(path)) {
        res.writeHead(404);
        res.end();
        return;
      }
      file = resolve(root, "index.html");
    }
    res.setHeader(
      "Content-Type",
      types[extname(file)] ?? "application/octet-stream",
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    );
    res.setHeader(
      "Cache-Control",
      file.includes(`${sep}assets${sep}`)
        ? "public, max-age=31536000, immutable"
        : "no-cache",
    );
    res.end(req.method === "HEAD" ? undefined : await readFile(file));
  } catch {
    res.writeHead(400);
    res.end("Invalid request.");
  }
}).listen(port, host, () => console.log(`FieldFit is running at ${origin}`));
