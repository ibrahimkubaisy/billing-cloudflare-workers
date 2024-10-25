import { Hono } from 'hono';
import { bearerAuth } from 'hono/bearer-auth';
import { prettyJSON } from 'hono/pretty-json';
import subscriptionApi from './subscription-api';
import customerApi from './customer-api';
import { Bindings } from './bindings';

const app = new Hono<{ Bindings: Bindings }>();
app.notFound((c) => c.json({ message: 'Not Found', ok: false }, 404));

const middleware = new Hono<{ Bindings: Bindings }>();
middleware.use('*', prettyJSON());

app.on(['POST', 'PUT', 'DELETE'], '/api/*', async (c, next) => {
	const bearer = bearerAuth({ token: c.env.API_TOKEN });
	return bearer(c, next);
});

app.get('/', (c) => {
	return c.json({ message: 'Hello' });
});

app.route('/api', middleware);

app.route('/api/subscriptions', subscriptionApi);
app.route('/api/customers', customerApi);

export default app;
