#!/usr/bin/env node

const { runCli } = require("../dist/cli.js");

const code = runCli(process.argv.slice(2), console);
process.exitCode = code;
