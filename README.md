# @nonagenticai/license-validator

[![CI](https://github.com/nonagenticai/license-validator/actions/workflows/ci-public.yml/badge.svg)](https://github.com/nonagenticai/license-validator/actions/workflows/ci-public.yml)
[![Release](https://img.shields.io/github/v/release/nonagenticai/license-validator)](https://github.com/nonagenticai/license-validator/releases)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

License validation package for n8n custom modules with intelligent caching.

| | |
|---|---|
| **Runtime** | Node.js 26 (see [`.nvmrc`](.nvmrc)) · TypeScript |
| **Depends on** | licences service (`/license/introspect`); no runtime npm dependencies beyond the native `fetch` API |
| **Runs on** | n8n worker processes, through the custom node packages that import it |

## What License Validator Does

Every n8n custom node on the nonagentic.ai platform must verify that the user holds an active license before executing any workflow operation. This TypeScript package provides that verification as a shared dependency: custom node packages import it, call `validate(token)` with the user's license token, and the validator checks whether the token represents an active, non-expired license by calling the licenses service's `/license/introspect` endpoint. If the token is invalid, expired, or unrecognized, the validator throws an error that prevents the node from executing.

Because n8n workflows can execute hundreds of times per minute, hitting the licenses service on every execution would create unnecessary load and latency. The validator caches introspection results in memory with a configurable TTL (5 minutes by default), so a valid license is verified once and then reused across subsequent executions within the cache window. A singleton pattern ensures all nodes within the same n8n worker process share a single cache instance, and concurrent validation prevention ensures that parallel workflow executions for the same token do not trigger redundant introspection calls.

The package is consumed by the n8n custom node packages and installed into the n8n image at build time alongside them. It has no external runtime dependencies beyond the native `fetch` API, making it lightweight enough to bundle into any Node.js-based consumer without adding dependency weight.

## Features

- Token-based license validation against introspect endpoint
- Built-in caching to minimize API calls (5-minute default TTL)
- Singleton pattern for module-level cache persistence
- Concurrent validation prevention
- Configurable endpoints, cache TTL, and request timeout

## Installation

```bash
npm install @nonagenticai/license-validator
```

## Quick start

```bash
git clone https://github.com/nonagenticai/license-validator.git
cd license-validator
npm ci
npm run build
npm test
```

## Usage

```typescript
import { getLicenseValidator } from '@nonagenticai/license-validator';

// Get singleton instance
const validator = getLicenseValidator();

// Validate license (throws on invalid)
await validator.validate(licenseToken);
```

## Configuration

The introspect URL can be supplied as the constructor's `introspectUrl` option or through the
`NONAGENTIC_LICENSES_BASE_URL` environment variable. The remaining options are constructor-only.

| Setting | Default | Meaning |
|---------|---------|---------|
| `introspectUrl` (option) | `NONAGENTIC_LICENSES_BASE_URL` when set, otherwise `""` | licences `/license/introspect` endpoint |
| `NONAGENTIC_LICENSES_BASE_URL` (environment variable) | unset (`""`) | Default value for `introspectUrl` |
| `cacheTtlSeconds` | `300` (5 minutes) | How long a validation result stays cached |
| `timeoutMs` | `10000` (10 seconds) | Per-request timeout for the introspect call |

With no introspect URL configured (neither the option nor the environment variable), `validate()`
throws a clear "not configured" error instead of guessing an endpoint.

The example below shows **overrides**, not defaults:

```typescript
import { LicenseValidator } from '@nonagenticai/license-validator';

const validator = new LicenseValidator({
  introspectUrl: 'http://custom-endpoint:8544/license/introspect',
  cacheTtlSeconds: 600, // 10 minutes
  timeoutMs: 15000, // 15 seconds
});
```

## API

### `getLicenseValidator(options?)`
Get the global singleton validator instance. Options are applied only when the singleton is first
created.

### `new LicenseValidator(options?)`
Create an independent validator. It accepts the configuration options in the table above.

### `LicenseValidator.validate(token: string): Promise<void>`
Validate a license token. Throws an error if the token is invalid, expired, or cannot be verified.

### `LicenseValidator.clearCache()`
Clear all cached validation results.

### `LicenseValidator.clearCacheForToken(token: string)`
Clear the cache entry for a specific token.

### `resetLicenseValidator()`
Clear the global singleton so the next `getLicenseValidator()` call creates a new instance.

The package also exports the `LicenseValidatorOptions`, `LicenseIntrospectResponse`,
`ValidatedLicense`, `LicensePlan`, and `LicenseCache` types, plus the
`DEFAULT_INTROSPECT_URL`, `DEFAULT_CACHE_TTL_SECONDS`, and `DEFAULT_TIMEOUT_MS` constants.

## Development

Node.js is pinned by [`.nvmrc`](.nvmrc) (26.13.0). The package's real npm scripts are:

| Script | Command | Purpose |
|--------|---------|---------|
| `npm run build` | `tsc` | Compile `src/` to `dist/` |
| `npm run lint` | `eslint "src/**/*.ts"` | Lint the TypeScript sources |
| `npm test` | `NODE_OPTIONS='--localstorage-file=/tmp/jest-localstorage' jest --passWithNoTests` | Run the Jest tests |

From a fresh clone:

```bash
npm ci --registry=https://registry.npmjs.org/
npm run build
npm run lint
npm test
```

## CI/CD

`.github/workflows/ci-public.yml` runs on pull requests, pushes to `main`, and manual dispatches, on
GitHub-hosted runners:

1. **Secret scan** — betterleaks with `.betterleaks.toml`
2. **No private refs** — `scripts/ci/no-private-refs.sh`
3. **Checks** — `npm ci` from the public registry, `npm run build`, `npm run lint`, `npm test`,
   and `npm audit --omit=dev --audit-level=high` on production dependencies
4. **Publish** — when the repository variable `PUBLISH_NPM` is `true` and the ref is `main`, publishes
   once per version through npm OIDC/Trusted Publishing with provenance

The workflow performs no deployment.

## Security

Report vulnerabilities privately through the repository's Security tab — see
[`SECURITY.md`](SECURITY.md). Do not open a public issue for a security problem.

## Contributing

Issues and pull requests are welcome. See
[`CONTRIBUTING.md`](https://github.com/nonagenticai/.github/blob/main/CONTRIBUTING.md) for the
organisation-wide rules; setup, test and lint commands are in **Development** above. Commits carry DCO
sign-off.

## Licensing

This package validates licence tokens for n8n custom modules against the licences service at
`NONAGENTIC_LICENSES_BASE_URL` (or the `introspectUrl` option). It is part of the optional
licensing stack: nothing else in the nonagenticai platform requires it. With no introspect URL
configured the validator reports that it is not configured rather than guessing.

Apache-2.0 covers the code; running it requires no licence key.

## License

Apache 2.0 — see [`LICENSE`](LICENSE) and [`NOTICE`](NOTICE).
