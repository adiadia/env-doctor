import type { EnvBaseType } from "./types";

export function parseByType(type: EnvBaseType, raw: string): unknown {
  switch (type) {
    case "string":
      return raw;

    case "number": {
      // Trim to handle " 3000 "
      const n = Number(raw.trim());
      if (!Number.isFinite(n)) {
        throw new Error(`expected number, got "${raw}"`);
      }
      return n;
    }

    case "boolean": {
      const v = raw.trim().toLowerCase();
      if (["true", "1", "yes", "y", "on"].includes(v)) return true;
      if (["false", "0", "no", "n", "off"].includes(v)) return false;
      throw new Error(
        `expected boolean (true/false/1/0/yes/no/on/off), got "${raw}"`,
      );
    }

    case "json": {
      try {
        return JSON.parse(raw);
      } catch {
        throw new Error(`expected json, got "${raw}"`);
      }
    }

    case "url": {
      try {
        // If it doesn't parse as a URL, this throws.
        // We return the original string (common for configs).
        new URL(raw);
        return raw;
      } catch {
        throw new Error(`expected url, got "${raw}"`);
      }
    }

    /* v8 ignore next -- @preserve */
    default: {
      // Exhaustive check (unreachable at runtime)
      const _never: never = type;
      return _never;
    }
  }
}

export function splitOptional(schemaValue: string): {
  baseType: EnvBaseType;
  optional: boolean;
} {
  const optional = schemaValue.endsWith("?");
  const base = optional ? schemaValue.slice(0, -1) : schemaValue;

  // runtime safety
  const allowed = ["string", "number", "boolean", "json", "url"] as const;
  if (!allowed.includes(base as any)) {
    throw new Error(
      `Unsupported type "${schemaValue}". Supported: string, number, boolean, json, url (optional with ?)`,
    );
  }

  return { baseType: base as EnvBaseType, optional };
}
