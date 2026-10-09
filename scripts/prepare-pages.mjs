import {
  cp,
  mkdir,
  readdir,
  readFile,
  unlink,
  writeFile,
} from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const built = resolve(root, "dist/pages");
const assets = resolve(root, "site-assets");
// This directory contains only the generated Pages assets. Do not delete other files.
await mkdir(assets, { recursive: true });
for (const entry of await readdir(assets, { withFileTypes: true })) {
  if (entry.isFile() && /\.(js|css)$/.test(entry.name))
    await unlink(resolve(assets, entry.name));
}
await cp(resolve(built, "site-assets"), assets, { recursive: true });
await writeFile(
  resolve(root, "index.html"),
  await readFile(resolve(built, "index.html")),
);
await cp(resolve(built, "favicon.svg"), resolve(root, "favicon.svg"));
await writeFile(resolve(root, ".nojekyll"), "");
console.log(
  "GitHub Pages files prepared in the repository root. Commit them with the source changes.",
);
