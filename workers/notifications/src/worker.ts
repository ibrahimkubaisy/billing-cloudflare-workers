import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

import { email } from './utils/mailgun';

export interface Env {
	MAILGUN_API_KEY: string;
	MAILGUN_DOMAIN: string;
	MAILGUN_FROM_ADDRESS: string;
}

// TODO: Test

const app = new Hono<{ Bindings: Env }>();

// Middleware: Add response time
app.use(async (c, next) => {
	const start = Date.now();
	await next();
	const end = Date.now();
	c.res.headers.set('X-Response-Time', `${end - start}`);
});

// TODO: Logger Middleware
// TODO: Don't log credentials
// TODO: Auth Middleware

// TODO: Cors Middleware

// Validation with Zod
const emailSchema = z.object({
	to: z.array(z.string().email()).nonempty().max(5),
	subject: z.string(),
	emailBody: z.string().optional(),
});

type Email = z.infer<typeof emailSchema>;
// const validator = ()

app.post('/api/email', zValidator('json', emailSchema), async (c) => {
	const {
		to = ['ibrahim.alkubaisy@gmail.com'],
		subject = 'Testing env vars',
		emailBody = 'Testing some Mailgun awesomeness!',
	} = c.req.valid('json');

	const response = await email(c, to, subject, emailBody);

	// Handle response
	if (response.ok) {
		const result = await response.json();

		c.status(200);
		return c.json({ result, response });
	} else {
		c.status(500);
		return c.json({ response });
		// const errorResponse = new Response('Unauthorized', {
		// 	status: 401,
		// 	headers: {
		// 		Authenticate: 'error="invalid_token"',
		// 	},
		// });

		// throw new HTTPException(401, { res: errorResponse });
	}
});

// erroring
// app.onError((err, c) => {
// 	if (err instanceof HTTPException) {
// 		return err.getResponse();
// 	}
// });

export default app;
