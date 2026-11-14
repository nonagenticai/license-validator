# @nonagenticai/license-validator

[![CI](https://github.com/nonagenticai/license-validator/actions/workflows/ci-public.yml/badge.svg)](https://github.com/nonagenticai/license-validator/actions/workflows/ci-public.yml)
[![Release](https://img.shields.io/github/v/release/nonagenticai/license-validator)](https://github.com/nonagenticai/license-validator/releases)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

License validation package for n8n custom modules with intelligent caching.

## What License Validator Does

Every n8n custom node on the nonagentic.ai platform must verify that the user holds an active license before executing any workflow operation. This TypeScript package provides that verification as a shared dependency: custom node packages import it, call `validate(token)` with the user's license token, and the validator checks whether the token represents an active, non-expired license by calling the licenses service's `/license/introspect` endpoint. If the token is invalid, expired, or unrecognized, the validator throws an error that prevents the node from executing.

Because n8n workflows can execute hundreds of times per minute, hitting the licenses service on every execution would create unnecessary load and latency. The validator caches introspection results in memory with a configurable TTL (5 minutes by default), so a valid license is verified once and then reused across subsequent executions within the cache window. A singleton pattern ensures all nodes within the same n8n worker process share a single cache instance, and concurrent validation prevention ensures that parallel workflow executions for the same token do not trigger redundant introspection calls.

The package is consumed by the n8n custom node packages and installed into the n8n image at build time alongside them. It has no external runtime dependencies beyond the native `fetch` API, making it lightweight enough to bundle into any Node.js-based consumer without adding dependency weight.

## Features

- Token-based license validation against introspect endpoint
- Built-in caching to minimize API calls (5-minute default TTL)
- Singleton pattern for module-level cache persistence
- Concurrent validation prevention
- Configurable timeouts and endpoints

## Installation

```bash
npm install @nonagenticai/license-validator
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
Get the global singleton validator instance.

### `LicenseValidator.validate(token: string): Promise<void>`
Validate a license token. Throws error if invalid.

### `LicenseValidator.clearCache()`
Clear all cached validation results.

### `LicenseValidator.clearCacheForToken(token: string)`
Clear cache for a specific token.

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

## Security

Report vulnerabilities privately through the repository's Security tab — see
[`SECURITY.md`](SECURITY.md). Do not open a public issue for a security problem.

## Contributing

Issues and pull requests are welcome. See
[`CONTRIBUTING.md`](https://github.com/nonagenticai/.github/blob/main/CONTRIBUTING.md) for the
organisation-wide rules; setup, test and lint commands are in this README. Commits carry DCO
sign-off.

## Licensing

This package validates licence tokens for n8n custom modules against the licences service at
`NONAGENTIC_LICENSES_BASE_URL` (or the `introspectUrl` option). It is part of the optional
licensing stack: nothing else in the nonagenticai platform requires it. With no introspect URL
configured the validator reports that it is not configured rather than guessing.

Apache-2.0 covers the code; running it requires no licence key.

## License

Apache 2.0 — see [`LICENSE`](LICENSE) and [`NOTICE`](NOTICE).
