export type EnvBaseType = "string" | "number" | "boolean" | "json" | "url";
export type EnvSchemaValue = EnvBaseType | `${EnvBaseType}?`;

export type EnvDoctorSchema = Record<string, EnvSchemaValue>;

export type EnvDoctorOptions = {
  /**
   * Load .env automatically using dotenv.
   * Default: true
   */
  loadDotEnv?: boolean;

  /**
   * Override env source (useful for tests)
   * Default: process.env
   */
  env?: Record<string, string | undefined>;

  /**
   * If true, throw on unknown env vars is NOT implemented in v1.
   * Placeholder for future.
   */
  strict?: boolean;
};

export type ParsedEnvValue = string | number | boolean | unknown;

export type EnvDoctorResult<TSchema extends EnvDoctorSchema> = {
  [K in keyof TSchema]: TSchema[K] extends `${string}?`
    ? ParsedEnvValue | undefined
    : ParsedEnvValue;
};
