/**
 * Type definitions for license validation
 */

/**
 * Response from the license introspect endpoint
 */
export interface LicenseIntrospectResponse {
	active: boolean;
	exp?: number;        // Expiry timestamp (Unix seconds)
	sub?: string;        // Subject (customer ID)
	scope?: string;      // Licensed features
	error?: string;      // Error message if not active
	reason?: string;     // Detailed reason for denial
}

/**
 * Validated license information returned to consumers
 */
export interface ValidatedLicense {
	valid: boolean;
	expiresAt?: number;
	subject?: string;
	scope?: string;
	error?: string;
}

/**
 * License plan information
 */
export interface LicensePlan {
	name: string;
	features: string[];
	expiresAt?: number;
}

/**
 * LicenseValidator configuration options
 */
export interface LicenseValidatorOptions {
	/** License introspect endpoint URL */
	introspectUrl?: string;
	/** Cache TTL in seconds (default: 300 = 5 minutes) */
	cacheTtlSeconds?: number;
	/** Request timeout in milliseconds (default: 10000) */
	timeoutMs?: number;
}

/**
 * Internal cache structure for license validation results
 */
export interface LicenseCache {
	valid: boolean;
	checkedAt: number;
	expiresAt?: number;
	error?: string;
}
