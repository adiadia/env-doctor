# env-typed-checker 

Validate and parse environment variables using a tiny schema — with both a **TypeScript/Node API** and a **CLI**.

It helps your app fail fast when configuration is wrong:

- ❌ Missing required variables
- ❌ Wrong types (e.g. `PORT="abc"`)
- ❌ Invalid URLs or JSON
- ❌ Silent mistakes that only crash later

---

## ✨ Features

- Simple schema syntax (`"number"`, `"boolean?"`, `"url"`, `"json"`, `"string"`)
- Loads `.env` automatically via `dotenv` (optional)
- Aggregated, friendly error output (shows all issues at once)
- TypeScript types inferred from the schema
- CLI for quick checks (great for CI)
- Minimal dependencies (runtime: `dotenv` only)

---

## 📦 Install

```bash
npm install env-typed-checker
```

## 🚀 Quick Start (Code)

```ts
import { envDoctor } from "env-typed-checker";

export const config = envDoctor({
  PORT: "number",
  DB_URL: "url",
  DEBUG: "boolean?"
});
```

### What you get

* PORT → number

* DB_URL → string (validated as URL)

* DEBUG → boolean | undefined (optional)


### 🧩 Supported Types
| Type | Description |
| :--- | :--- |
| **string** | Any string value |
| **number** | A finite number (automatically parsed from string) |
| **boolean** | Supports `true` / `false`, `1` / `0`, and `yes` / `no` |
| **json** | Validates and parses a valid JSON string |
| **url** | Validates for a properly formatted URL |


### Optional Values
Add ? to make a variable optional:
```ts
envDoctor({ DEBUG: "boolean?" });
```
If missing → value will be undefined.


### ⚙️ Options

```ts
envDoctor(schema, {
  loadDotEnv: true,   // default: true (loads .env)
  env: process.env    // default: process.env (override for tests)
});
```

### 🧪 Testing with custom env

```ts
import { envDoctor } from "env-typed-checker";

const cfg = envDoctor(
  { PORT: "number" },
  { loadDotEnv: false, env: { PORT: "3000" } }
);

console.log(cfg.PORT); // 3000
```

### ❌ Error Example

Given a `.env` like:

```env
PORT=abc
DB_URL=not-a-url
```

```ts
import { envDoctor } from "env-typed-checker";

envDoctor({
  PORT: "number",
  DB_URL: "url"
});
```

### Output:

```ts
ENV validation failed
- PORT: expected number, got "abc"
- DB_URL: expected url, got "not-a-url"
```
All errors are shown together so you can fix them in one go.

# 🖥️ CLI

Validate your environment without writing code — perfect for CI pipelines.

## 1) Create a schema file

`env.schema.json`
```json
{
  "PORT": "number",
  "DB_URL": "url",
  "DEBUG": "boolean?"
}
```

## 2) Run the check

```bash
npx env-typed-checker check --schema env.schema.json
```

### Options

```bash
# Custom env file
npx env-typed-checker check --schema env.schema.json --env-file .env.production

# Skip dotenv (use process.env only)
npx env-typed-checker check --schema env.schema.json --no-dotenv
```

## Exit codes

* `0` = OK

* `1` = validation failed

* `2` = CLI usage / unexpected error

## ✅ CI Example (GitHub Actions)

Add this to your workflow to fail the build if env is invalid:

```yml
- name: Validate env
  run: npx env-typed-checker check --schema env.schema.json
```
(If you use a different env file in CI, pass --env-file.)

## 🛠 Development
Clone the repo and install:
```bash
npm install
```
### Available Scripts
```bash
npm run build      # build package
npm run test       # run tests
npm run typecheck  # TypeScript check
npm run dev        # watch build
```

### 🤝 Contributing
PRs are welcome!

* Add new validators (e.g. `enum`, `regex`, `email`)

* Improve CLI output formatting

* Add .env.example generator

* Improve docs & examples

* Please read CONTRIBUTING.md before opening a PR.

###  📌 Roadmap
* `.env.example` generator

* Strict mode: warn on unknown variables

* More schema features: enums, defaults, min/max

* Framework helpers (Next.js / Express / etc.)


# 📝 License
MIT


---

```yml
::contentReference[oaicite:0]{index=0}
```