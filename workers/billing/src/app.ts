import { Hono } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';
import { prettyJSON } from 'hono/pretty-json';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { trimTrailingSlash } from 'hono/trailing-slash';
import { logger } from 'hono/logger';
import { Env } from './worker';
import invoiceApi from './invoice-api';

const app = new Hono<{ Bindings: Env }>();
app.notFound((c) => c.json({ message: 'Not Found', ok: false }, 404));

const middleware = new Hono<{ Bindings: Env }>();
middleware.use(prettyJSON());
middleware.use(cors());
middleware.use(secureHeaders());
middleware.use(trimTrailingSlash());
middleware.use(logger());

app.on(['POST', 'PUT', 'DELETE'], '/api/*', async (c, next) => {
	const bearer = bearerAuth({ token: c.env.API_TOKEN });
	return bearer(c, next);
});

app.get('/', (c) => {
	return c.json({ message: 'Hello' });
});

app.route('/api', middleware);
app.route('/api/invoices', invoiceApi);

export default app;
