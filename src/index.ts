/**
 * @nonagenticai/license-validator
 *
 * License validation package for n8n custom modules
 */

// Re-export types
export type {
	LicenseIntrospectResponse,
	ValidatedLicense,
	LicensePlan,
	LicenseValidatorOptions,
	LicenseCache,
} from './types';

// Re-export constants
export {
	DEFAULT_INTROSPECT_URL,
	DEFAULT_CACHE_TTL_SECONDS,
	DEFAULT_TIMEOUT_MS,
} from './constants';

// Re-export LicenseValidator class and functions
export {
	LicenseValidator,
	getLicenseValidator,
	resetLicenseValidator,
} from './LicenseValidator';
