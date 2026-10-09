import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createHash } from "node:crypto";

type Value = string | number | bigint | null | Uint8Array;
const filename = resolve(
  process.env.FIELDFIT_DATABASE ?? ".data/fieldfit.sqlite",
);
mkdirSync(dirname(filename), { recursive: true });
const sqlite = new DatabaseSync(filename);
sqlite.exec(
  "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;",
);
sqlite.exec(
  "CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL)",
);
const migrationDir = resolve("db/migrations");
for (const name of readdirSync(migrationDir)
  .filter((n) => n.endsWith(".sql"))
  .sort()) {
  const sql = readFileSync(resolve(migrationDir, name), "utf8");
  const checksum = createHash("sha256").update(sql).digest("hex");
  const applied = sqlite
    .prepare("SELECT checksum FROM _migrations WHERE name=?")
    .get(name);
  if (applied) {
    if (applied.checksum !== checksum)
      throw new Error(`Applied migration changed: ${name}`);
    continue;
  }
  sqlite.exec("BEGIN IMMEDIATE");
  try {
    sqlite.exec(sql);
    sqlite
      .prepare("INSERT INTO _migrations(name,checksum) VALUES(?,?)")
      .run(name, checksum);
    sqlite.exec("COMMIT");
  } catch (error) {
    sqlite.exec("ROLLBACK");
    throw error;
  }
}

class Statement {
  constructor(
    private sql: string,
    private values: Value[] = [],
  ) {}
  bind(...values: Value[]) {
    return new Statement(this.sql, values);
  }
  first(): any {
    return sqlite.prepare(this.sql).get(...this.values) ?? null;
  }
  all(): { results: any[] } {
    return { results: sqlite.prepare(this.sql).all(...this.values) };
  }
  run() {
    const result = sqlite.prepare(this.sql).run(...this.values);
    return { meta: { changes: Number(result.changes) } };
  }
}

export const database = {
  prepare(sql: string) {
    return new Statement(sql);
  },
  batch(statements: Statement[]) {
    sqlite.exec("BEGIN IMMEDIATE");
    try {
      const results = statements.map((statement) => statement.run());
      sqlite.exec("COMMIT");
      return results;
    } catch (error) {
      sqlite.exec("ROLLBACK");
      throw error;
    }
  },
};
