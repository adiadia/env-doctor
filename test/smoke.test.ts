import { describe, it, expect } from "vitest";
import { envDoctor, EnvDoctorError } from "../src";

describe("envDoctor (v1)", () => {
  it("parses values according to schema (number + optional boolean)", () => {
    const cfg = envDoctor(
      { PORT: "number", DEBUG: "boolean?" },
      { loadDotEnv: false, env: { PORT: "3000", DEBUG: "true" } }
    );

    expect(cfg.PORT).toBe(3000);
    expect(cfg.DEBUG).toBe(true);
  });

  it("allows optional values to be missing", () => {
    const cfg = envDoctor({ DEBUG: "boolean?" }, { loadDotEnv: false, env: {} });
    expect(cfg.DEBUG).toBe(undefined);
  });

  it("treats empty string as missing (required fails, optional ok)", () => {
    expect(() =>
      envDoctor({ PORT: "number" }, { loadDotEnv: false, env: { PORT: "" } })
    ).toThrow(EnvDoctorError);

    const cfg = envDoctor(
      { DEBUG: "boolean?" },
      { loadDotEnv: false, env: { DEBUG: "" } }
    );
    expect(cfg.DEBUG).toBe(undefined);
  });

  it("parses all supported types (string, number, boolean true/false, json, url)", () => {
    const cfg = envDoctor(
      {
        S: "string",
        N: "number",
        BT: "boolean",
        BF: "boolean",
        J: "json",
        U: "url"
      },
      {
        loadDotEnv: false,
        env: {
          S: "hello",
          N: "42",
          BT: "yes",
          BF: "0",
          J: '{"x":1}',
          U: "https://example.com"
        }
      }
    );

    expect(cfg.S).toBe("hello");
    expect(cfg.N).toBe(42);
    expect(cfg.BT).toBe(true);
    expect(cfg.BF).toBe(false);
    expect(cfg.J).toEqual({ x: 1 });
    expect(cfg.U).toBe("https://example.com");
  });

  it("throws a friendly error with all issues (missing + invalid)", () => {
    try {
      envDoctor(
        { PORT: "number", DB_URL: "url", REQ: "string" },
        { loadDotEnv: false, env: { PORT: "abc", DB_URL: "not-a-url" } }
      );
      throw new Error("expected to throw");
    } catch (e) {
      expect(e).toBeInstanceOf(EnvDoctorError);
      const err = e as EnvDoctorError;
      expect(err.message).toContain("PORT");
      expect(err.message).toContain("DB_URL");
      expect(err.message).toContain("REQ");
    }
  });

  it("throws on invalid boolean/json/url/number inputs (covers error branches)", () => {
    expect(() =>
      envDoctor(
        { N: "number", B: "boolean", J: "json", U: "url" },
        { loadDotEnv: false, env: { N: "NaN!", B: "maybe", J: "{", U: "nope" } }
      )
    ).toThrow(EnvDoctorError);
  });

  it("captures invalid schema types as issues (covers schema error branch)", () => {
    expect(() =>
      envDoctor(
        // @ts-expect-error runtime schema validation
        { X: "madeup" },
        { loadDotEnv: false, env: { X: "1" } }
      )
    ).toThrow(EnvDoctorError);
  });

  it("covers dotenv branch (loadDotEnv=true) without relying on .env", () => {
    const cfg = envDoctor({ OPT: "string?" }, { loadDotEnv: true, env: {} });
    expect(cfg.OPT).toBe(undefined);
  });
});
