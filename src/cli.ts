import fs from "node:fs";
import path from "node:path";
import * as dotenv from "dotenv";
import { envDoctor, EnvDoctorError } from "./index";
import type { EnvDoctorSchema } from "./types";

type Io = {
  log: (msg: string) => void;
  error: (msg: string) => void;
};

function parseArgs(argv: string[]) {
  const out: {
    cmd?: string;
    schemaPath?: string;
    envFile?: string;
    useDotenv: boolean;
  } = { useDotenv: true };

  const [cmd, ...rest] = argv;
  out.cmd = cmd;

  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];

    if (a === "--schema") {
      out.schemaPath = rest[++i];
    } else if (a.startsWith("--schema=")) {
      out.schemaPath = a.split("=", 2)[1];
    } else if (a === "--env-file") {
      out.envFile = rest[++i];
    } else if (a.startsWith("--env-file=")) {
      out.envFile = a.split("=", 2)[1];
    } else if (a === "--no-dotenv") {
      out.useDotenv = false;
    }
  }

  return out;
}

function loadSchema(schemaPath: string): EnvDoctorSchema {
  const abs = path.resolve(process.cwd(), schemaPath);
  const raw = fs.readFileSync(abs, "utf8");
  const json = JSON.parse(raw);

  if (!json || typeof json !== "object" || Array.isArray(json)) {
    throw new Error("Schema must be a JSON object of key -> type.");
  }

  // Ensure values are strings
  for (const [k, v] of Object.entries(json)) {
    if (typeof k !== "string" || typeof v !== "string") {
      throw new Error("Schema must be a JSON object of string -> string.");
    }
  }

  return json as EnvDoctorSchema;
}

export function runCli(argv: string[], io: Io = console): number {
  const { cmd, schemaPath, envFile, useDotenv } = parseArgs(argv);

  if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h") {
    io.log(
      [
        "env-typed-checker",
        "",
        "Usage:",
        "  env-typed-checker check --schema <file> [--env-file <file>] [--no-dotenv]",
        "",
        "Options:",
        "  --schema <file>     Path to schema JSON (required)",
        "  --env-file <file>   Env file path (default: .env)",
        "  --no-dotenv         Do not load env file; use process.env only",
        "",
        "Exit codes:",
        "  0 = OK, 1 = validation failed, 2 = CLI error",
      ].join("\n"),
    );
    return 0;
  }

  if (cmd !== "check") {
    io.error(`Unknown command: ${cmd}`);
    return 2;
  }

  if (!schemaPath) {
    io.error("Missing required option: --schema <file>");
    return 2;
  }

  try {
    if (useDotenv) {
      const p = envFile ?? ".env";
      dotenv.config({ path: path.resolve(process.cwd(), p) });
    }

    const schema = loadSchema(schemaPath);

    // envDoctor will validate and throw EnvDoctorError if invalid
    envDoctor(schema, { loadDotEnv: false, env: process.env });

    io.log("✅ Environment is valid.");
    return 0;
  } catch (e) {
    if (e instanceof EnvDoctorError) {
      io.error(e.message);
      return 1;
    }
    io.error(String(e));
    return 2;
  }
}
