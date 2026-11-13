# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security

- Cleared both critical advisories (`handlebars` 3.0.0–4.7.9) and every fixable high one via a
  lockfile refresh. `npm audit` goes from 30 findings (1 critical) to 27, with no criticals.
- Cleared the `minimatch` advisory (GHSA-g3hv-75wg-m249). Its patched release is **11.0.1**, but
  `eslint` 10.14.0 requires `minimatch@^10.2.6` and `10.2.6` is the newest 10.x, so Dependabot
  could only propose downgrading `eslint` to 9.x — which it refuses to do, and its update job
  errored out on `main` as a result. An npm `overrides` entry bridges `minimatch` to 11.0.1;
  build, lint and tests all pass on it.

### Known limitation

- Three high findings remain, all one root: `zod` 3.25.76 (GHSA-mrhx-c7xc-m3w5), reached as
  `n8n-workflow` → `@n8n/expression-runtime` → `zod`. `n8n-workflow` is a **devDependency** and
  the package declares no peer dependency on it, so nothing here ships that code. There is no
  non-breaking fix: `@n8n/expression-runtime` pins `zod` to exactly `3.25.76`, and the only
  upgrade npm proposes is downgrading `n8n-workflow` to 1.75.1 — a major regression in a build
  tool, not a fix. Revisit when `@n8n/expression-runtime` moves to zod 4.

## [1.0.2] - 2026-11-13

First public release.
