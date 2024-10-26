// export type Bindings = {
// 	BW: any;
// 	KV: KVNamespace;
// 	URL: string;
// };



// const durableObjectMiddleware = createMiddleware<Env>(async (c, next) => {
// 	const name = c.req.query('name');
// 	if (!name) {
// 		return c.text('Select a Durable Object to contact by using the `name` URL query string parameter, for example, ?name=A');
// 	}
// 	const id = c.env.INVOICES.idFromName(name);
// 	const stub = c.env.INVOICES.get(id);
// 	c.set('stub', stub);
// 	await next();
// 	c.res = c.text(`Durable Object '${name}' count: ${c.var.invoice}`);
// });

// import { Hono } from 'hono';
// import { Bindings } from './type';
// import get from './services';
// import insert from './services/insert';

// const app = new Hono<{ Bindings: Bindings }>();

// app.get('/insert', async (c) => {
// 	const result = await insert(c.env);
// 	if (result instanceof Error || result === null) {
// 		return c.json({
// 			status: 500,
// 			message: 'Error inserting data',
// 			error: result,
// 		});
// 	}

// 	return c.json({
// 		status: 200,
// 		message: 'Inserting data',
// 		data: result,
// 	});
// });

// app.route('/', get);

// export default app;
