/**
 * Constants for license validation
 */

/**
 * Default license introspect endpoint URL.
 *
 * Per gitops-production/docs/config-externalization-policy.md, no hardcoded
 * URL fallback. Set via env (NONAGENTIC_LICENSES_BASE_URL) or pass
 * `introspectUrl` to LicenseValidator. Empty string forces a clear error
 * at the call-site if neither is configured.
 */
export const DEFAULT_INTROSPECT_URL = process.env.NONAGENTIC_LICENSES_BASE_URL || '';

/**
 * Default cache TTL in seconds (5 minutes)
 */
export const DEFAULT_CACHE_TTL_SECONDS = 300;

/**
 * Default request timeout in milliseconds (10 seconds)
 */
export const DEFAULT_TIMEOUT_MS = 10000;
