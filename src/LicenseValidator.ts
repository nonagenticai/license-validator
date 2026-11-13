/**
 * LicenseValidator for n8n Custom Modules
 *
 * Validates license tokens against the introspect endpoint with caching
 * to avoid excessive API calls per workflow execution.
 *
 * @module LicenseValidator
 * @version 1.0.0
 */

import {
	LicenseIntrospectResponse,
	LicenseCache,
	LicenseValidatorOptions,
} from './types';
import {
	DEFAULT_INTROSPECT_URL,
	DEFAULT_CACHE_TTL_SECONDS,
	DEFAULT_TIMEOUT_MS,
} from './constants';

/**
 * LicenseValidator Class
 *
 * Validates license tokens with caching to minimize API calls.
 * Uses a singleton pattern for module-level caching across executions.
 */
export class LicenseValidator {
	private cache: Map<string, LicenseCache> = new Map();
	private validationInProgress: Map<string, Promise<void>> = new Map();
	private readonly options: Required<LicenseValidatorOptions>;

	constructor(options?: LicenseValidatorOptions) {
		this.options = {
			introspectUrl: options?.introspectUrl || DEFAULT_INTROSPECT_URL,
			cacheTtlSeconds: options?.cacheTtlSeconds || DEFAULT_CACHE_TTL_SECONDS,
			timeoutMs: options?.timeoutMs || DEFAULT_TIMEOUT_MS,
		};
	}

	/**
	 * Validate a license token.
	 * Throws an error if the license is invalid, expired, or cannot be verified.
	 *
	 * @param licenseToken - The license token to validate
	 * @throws Error if license is invalid or validation fails
	 */
	public async validate(licenseToken: string): Promise<void> {
		if (!licenseToken || licenseToken.trim() === '') {
			throw new Error('License token is required');
		}

		const normalizedToken = this.normalizeToken(licenseToken);
		const cacheKey = this.hashToken(normalizedToken);

		// Check cache first
		const cached = this.cache.get(cacheKey);
		if (cached && this.isCacheValid(cached)) {
			if (!cached.valid) {
				throw new Error(cached.error || 'License validation failed');
			}
			return; // Valid cached result
		}

		// Prevent concurrent validation requests for the same token
		const inProgress = this.validationInProgress.get(cacheKey);
		if (inProgress) {
			await inProgress;
			return this.validate(normalizedToken); // Re-check cache after waiting
		}

		// Perform validation
		const validationPromise = this.performValidation(normalizedToken, cacheKey);
		this.validationInProgress.set(cacheKey, validationPromise);

		try {
			await validationPromise;
		} finally {
			this.validationInProgress.delete(cacheKey);
		}
	}

	/**
	 * Perform the actual validation request to the introspect endpoint
	 */
	private async performValidation(licenseToken: string, cacheKey: string): Promise<void> {
		if (!this.options.introspectUrl) {
			throw new Error(
				'License introspect URL is not configured: set NONAGENTIC_LICENSES_BASE_URL env or pass introspectUrl to LicenseValidator',
			);
		}

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.options.timeoutMs);

		try {
			const response = await fetch(this.options.introspectUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ token: licenseToken }),
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				const errorText = await response.text().catch(() => 'Unknown error');
				let errorMessage: string;

				if (response.status === 401) {
					errorMessage = 'License token is invalid or malformed';
				} else if (response.status === 403) {
					errorMessage = 'License access denied';
				} else if (response.status >= 500) {
					// Don't cache server errors - allow retry
					throw new Error(`License server temporarily unavailable (${response.status}). Please try again.`);
				} else {
					errorMessage = `License validation failed: ${response.status} ${errorText}`;
				}

				this.cache.set(cacheKey, {
					valid: false,
					checkedAt: Date.now(),
					error: errorMessage,
				});
				throw new Error(errorMessage);
			}

			const data = (await response.json()) as LicenseIntrospectResponse;

			if (!data.active) {
				const errorMessage = data.error || data.reason || 'License is not active. Please check your subscription.';
				this.cache.set(cacheKey, {
					valid: false,
					checkedAt: Date.now(),
					error: errorMessage,
				});
				throw new Error(errorMessage);
			}

			// License is valid - cache the success
			this.cache.set(cacheKey, {
				valid: true,
				checkedAt: Date.now(),
				expiresAt: data.exp,
			});

		} catch (error) {
			clearTimeout(timeoutId);

			if (error instanceof Error) {
				// Re-throw already formatted errors
				if (error.message.includes('License')) {
					throw error;
				}

				// Handle network/abort errors
				if (error.name === 'AbortError') {
					throw new Error('License validation timed out. Please check your network connection.');
				}

				if (error.message.includes('fetch') || error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
					throw new Error('Unable to reach license server. Please check your network connection.');
				}
			}

			throw new Error(`License validation error: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Check if a cached result is still valid (within TTL)
	 */
	private isCacheValid(cached: LicenseCache): boolean {
		const ageSeconds = (Date.now() - cached.checkedAt) / 1000;
		return ageSeconds < this.options.cacheTtlSeconds;
	}

	/**
	 * Create a simple hash of the token for cache key (avoids storing raw token)
	 */
	private hashToken(token: string): string {
		// Simple hash for cache key - not cryptographic, just for keying
		let hash = 0;
		for (let i = 0; i < token.length; i++) {
			const char = token.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash; // Convert to 32-bit integer
		}
		return `lic_${hash.toString(16)}`;
	}

	/**
	 * Normalize tokens to tolerate optional "Bearer " prefix (case-insensitive).
	 */
	private normalizeToken(token: string): string {
		const trimmed = token.trim();
		if (trimmed.length === 0) {
			return trimmed;
		}
		return trimmed.replace(/^bearer\s+/i, '');
	}

	/**
	 * Clear the validation cache (useful for testing or forced revalidation)
	 */
	public clearCache(): void {
		this.cache.clear();
	}

	/**
	 * Clear cache for a specific token
	 */
	public clearCacheForToken(licenseToken: string): void {
		const cacheKey = this.hashToken(licenseToken);
		this.cache.delete(cacheKey);
	}
}

// Singleton instance for module-level caching
let globalValidator: LicenseValidator | null = null;

/**
 * Get the global LicenseValidator instance.
 * Uses singleton pattern to maintain cache across workflow executions.
 */
export function getLicenseValidator(options?: LicenseValidatorOptions): LicenseValidator {
	if (!globalValidator) {
		globalValidator = new LicenseValidator(options);
	}
	return globalValidator;
}

/**
 * Reset the global validator (useful for testing)
 */
export function resetLicenseValidator(): void {
	globalValidator = null;
}
