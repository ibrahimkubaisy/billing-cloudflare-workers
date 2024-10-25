import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Bindings } from './bindings';
import * as model from './models/customer';

const customerSchema = z.object({
	name: z.string().min(5),
	email: z.string().email(), // Ensure valid email format
	subscription_plan_id: z.string().min(1),
	subscription_status: z.enum(['active', 'cancelled', 'paused']),
});

type CustomerInput = z.infer<typeof customerSchema>;

const api = new Hono<{ Bindings: Bindings }>();

// Fetch all customers
api.get('/', async (c) => {
	const customers = await model.getCustomers(c.env.BILLIFY_KV);
	return c.json({ customers: customers, ok: true });
});

// Create a new customer
api.post('/', zValidator('json', customerSchema), async (c) => {
	const customerData: CustomerInput = c.req.valid('json');

	const newCustomer = await model.createCustomer(c.env.BILLIFY_KV, customerData);

	if (!newCustomer) {
		return c.json({ error: 'Cannot create new customer', ok: false }, 422);
	}

	return c.json({ customer: newCustomer, ok: true }, 201);
});

// Fetch a single customer by ID
api.get('/:id', async (c) => {
	const id = c.req.param('id');
	const customer = await model.getCustomer(c.env.BILLIFY_KV, id);

	if (!customer) {
		return c.json({ error: 'Not Found', ok: false }, 404);
	}
	return c.json({ customer: customer, ok: true });
});

// Update a customer by ID
api.put('/:id', zValidator('json', customerSchema.partial()), async (c) => {
	const id = c.req.param('id');
	const customer = await model.getCustomer(c.env.BILLIFY_KV, id);

	if (!customer) {
		// 204 No Content
		return new Response(null, { status: 204 });
	}

	const updatedData: Partial<CustomerInput> = c.req.valid('json');
	const success = await model.updateCustomer(c.env.BILLIFY_KV, id, updatedData);

	return c.json({ ok: success });
});

// Delete a customer by ID
api.delete('/:id', async (c) => {
	const id = c.req.param('id');
	const customer = await model.getCustomer(c.env.BILLIFY_KV, id);

	if (!customer) {
		// 204 No Content
		return new Response(null, { status: 204 });
	}

	const success = await model.deleteCustomer(c.env.BILLIFY_KV, id);

	return c.json({ ok: success });
});

export default api;
