import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "../src/cli";

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "env-typed-checker-"));
}

function writeJson(filePath: string, data: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

function setEnv(key: string, value: string) {
  process.env[key] = value;
  return () => {
    delete process.env[key];
  };
}

describe("CLI v2", () => {
  it("prints help and returns 0", () => {
    const out: string[] = [];
    const err: string[] = [];

    const code = runCli(["--help"], {
      log: (m) => out.push(m),
      error: (m) => err.push(m),
    });

    expect(code).toBe(0);
    expect(out.join("\n")).toContain("Usage:");
    expect(err.join("\n")).toBe("");
  });

  it("returns code 2 for unknown command", () => {
    const err: string[] = [];
    const code = runCli(["wat"], { log: () => {}, error: (m) => err.push(m) });

    expect(code).toBe(2);
    expect(err.join("\n")).toContain("Unknown command");
  });

  it("returns code 2 if --schema is missing for check", () => {
    const err: string[] = [];
    const code = runCli(["check"], {
      log: () => {},
      error: (m) => err.push(m),
    });

    expect(code).toBe(2);
    expect(err.join("\n")).toContain("--schema");
  });

  it("supports --schema=<file> and --env-file=<file> syntax (success path)", () => {
    const dir = tmpDir();
    const schemaFile = path.join(dir, "env.schema.json");
    const envFile = path.join(dir, ".env");

    writeJson(schemaFile, { PORT: "number" });
    fs.writeFileSync(envFile, "PORT=3000\n", "utf8");

    const out: string[] = [];
    const err: string[] = [];

    const code = runCli(
      ["check", `--schema=${schemaFile}`, `--env-file=${envFile}`],
      { log: (m) => out.push(m), error: (m) => err.push(m) },
    );

    expect(code).toBe(0);
    expect(out.join("\n")).toContain("✅");
    expect(err.join("\n")).toBe("");
  });

  it("loads default .env when --env-file is not provided", () => {
    const dir = tmpDir();
    const schemaFile = path.join(dir, "env.schema.json");
    writeJson(schemaFile, { PORT: "number" });

    // Put schema + .env in that folder
    fs.writeFileSync(path.join(dir, ".env"), "PORT=3000\n", "utf8");

    const oldCwd = process.cwd();
    process.chdir(dir);
    try {
      const out: string[] = [];
      const code = runCli(["check", "--schema", "env.schema.json"], {
        log: (m) => out.push(m),
        error: () => {},
      });

      expect(code).toBe(0);
      expect(out.join("\n")).toContain("✅");
    } finally {
      process.chdir(oldCwd);
    }
  });

  it("returns code 2 when schema JSON is not an object", () => {
    const dir = tmpDir();
    const schemaFile = path.join(dir, "env.schema.json");

    fs.writeFileSync(schemaFile, JSON.stringify(["PORT"], null, 2), "utf8");

    const err: string[] = [];
    const code = runCli(["check", "--schema", schemaFile, "--no-dotenv"], {
      log: () => {},
      error: (m) => err.push(m),
    });

    expect(code).toBe(2);
    expect(err.join("\n")).toContain("Schema must be a JSON object");
  });

  it("returns code 2 when schema values are not strings", () => {
    const dir = tmpDir();
    const schemaFile = path.join(dir, "env.schema.json");

    writeJson(schemaFile, { PORT: 123 });

    const err: string[] = [];
    const code = runCli(["check", "--schema", schemaFile, "--no-dotenv"], {
      log: () => {},
      error: (m) => err.push(m),
    });

    expect(code).toBe(2);
    expect(err.join("\n")).toContain("string -> string");
  });

  it("returns code 2 when schema file contains invalid JSON", () => {
    const dir = tmpDir();
    const schemaFile = path.join(dir, "env.schema.json");

    fs.writeFileSync(schemaFile, "not-json", "utf8");

    const err: string[] = [];
    const code = runCli(["check", "--schema", schemaFile, "--no-dotenv"], {
      log: () => {},
      error: (m) => err.push(m),
    });

    expect(code).toBe(2);
    // Message comes from JSON.parse exception
    expect(err.join("\n")).toContain("SyntaxError");
  });

  it("returns code 1 when validation fails (EnvDoctorError path)", () => {
    const dir = tmpDir();
    const schemaFile = path.join(dir, "env.schema.json");
    writeJson(schemaFile, { PORT: "number" });

    // Set bad env
    const cleanup = setEnv("PORT", "abc");
    try {
      const err: string[] = [];
      const code = runCli(["check", "--schema", schemaFile, "--no-dotenv"], {
        log: () => {},
        error: (m) => err.push(m),
      });

      expect(code).toBe(1);
      expect(err.join("\n")).toContain("PORT");
    } finally {
      cleanup();
    }
  });

  it("supports --env-file <file> (space separated) syntax", () => {
    const dir = tmpDir();
    const schemaFile = path.join(dir, "env.schema.json");
    const envFile = path.join(dir, ".env");

    writeJson(schemaFile, { PORT: "number" });
    fs.writeFileSync(envFile, "PORT=3000\n", "utf8");

    const out: string[] = [];
    const err: string[] = [];

    // ✅ covers: --schema <file> and --env-file <file>
    const code = runCli(
      ["check", "--schema", schemaFile, "--env-file", envFile],
      { log: (m) => out.push(m), error: (m) => err.push(m) },
    );

    expect(code).toBe(0);
    expect(out.join("\n")).toContain("✅");
    expect(err.join("\n")).toBe("");
  });
  it("ignores unknown flags", () => {
    const dir = tmpDir();
    const schemaFile = path.join(dir, "env.schema.json");
    writeJson(schemaFile, { PORT: "number?" });

    const code = runCli(
      ["check", "--schema", schemaFile, "--no-dotenv", "--unknown-flag"],
      { log: () => {}, error: () => {} },
    );

    expect(code).toBe(0);
  });
});
