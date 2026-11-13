import { LicenseValidator } from '../LicenseValidator';

describe('LicenseValidator', () => {
	let originalFetch: typeof fetch | undefined;

	beforeEach(() => {
		originalFetch = global.fetch;
		global.fetch = jest.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ active: true, exp: 0 }),
		}) as unknown as typeof fetch;
	});

	afterEach(() => {
		global.fetch = originalFetch as typeof fetch;
		jest.resetAllMocks();
	});

	it('strips Bearer prefix before calling introspect', async () => {
		const validator = new LicenseValidator({
			introspectUrl: 'http://licenses.test/license/introspect',
			cacheTtlSeconds: 60,
			timeoutMs: 1000,
		});

		await validator.validate('Bearer abc123');

		expect(global.fetch).toHaveBeenCalledTimes(1);
		const [, init] = (global.fetch as jest.Mock).mock.calls[0];
		const body = JSON.parse(init.body as string) as { token: string };
		expect(body.token).toBe('abc123');
	});
});
