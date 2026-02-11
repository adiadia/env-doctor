import { EnvDoctorError, type EnvDoctorIssue } from "./error";
import { parseByType, splitOptional } from "./parsers";
import type { EnvDoctorResult, EnvDoctorSchema } from "./types";

export function validateAndParse<TSchema extends EnvDoctorSchema>(
  schema: TSchema,
  env: Record<string, string | undefined>,
): EnvDoctorResult<TSchema> {
  const issues: EnvDoctorIssue[] = [];
  const out: Record<string, unknown> = {};

  for (const [key, schemaValue] of Object.entries(schema)) {
    let baseType: any;
    let optional: boolean;

    try {
      ({ baseType, optional } = splitOptional(schemaValue));
    } catch (e) {
      issues.push({
        key,
        kind: "invalid",
        message: String(e),
      });
      continue;
    }

    const raw = env[key];

    if (raw === undefined || raw === "") {
      if (optional) {
        out[key] = undefined;
      } else {
        issues.push({
          key,
          kind: "missing",
          message: "missing required environment variable",
        });
      }
      continue;
    }

    try {
      out[key] = parseByType(baseType, raw);
    } catch (e) {
      issues.push({
        key,
        kind: "invalid",
        message: String(e),
      });
    }
  }

  if (issues.length > 0) {
    throw new EnvDoctorError(issues);
  }

  return out as EnvDoctorResult<TSchema>;
}
