// test/index.spec.ts
import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect, test } from 'vitest';
import app from '../src/worker';

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('Test Notification worker', () => {
	it('responds with Hello World! (unit style)', async () => {
		const request = new IncomingRequest('http://example.com');
		// Create an empty context to pass to `worker.fetch()`.
		const ctx = createExecutionContext();
		const response = await app.fetch(request, env, ctx);
		// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
		await waitOnExecutionContext(ctx);
		expect(await response.json()).toMatchInlineSnapshot(`"Hello World!"`);
	});

	it('responds with Hello World! (integration style)', async () => {
		const response = await SELF.fetch('https://example.com');
		expect(await response.json()).toMatchInlineSnapshot(`"Hello World!"`);
	});

	// test('POST /posts', async () => {
	// 	const res = await app.request('/posts', {
	// 		method: 'POST',
	// 	});
	// 	expect(res.status).toBe(201);
	// 	expect(res.headers.get('X-Custom')).toBe('Thank you');
	// 	expect(await res.json()).toEqual({
	// 		message: 'Created',
	// 	});
	// });
});
