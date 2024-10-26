import { Context, Hono, Next } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Bindings } from './bindings';
import * as model from './models/customer';
import { createRoute, OpenAPIHono } from '@hono/zod-openapi';

const customerSchema = z.object({
	name: z.string().min(5),
	email: z.string().email(), // Ensure valid email format
	subscription_plan_id: z.string().min(1),
	subscription_status: z.enum(['active', 'cancelled', 'paused']),
	next_billing_date: z.preprocess((val) => (typeof val === 'string' ? new Date(val) : val), z.date().nullable()),
});

type CustomerInput = z.infer<typeof customerSchema>;

const api = new OpenAPIHono<{ Bindings: Bindings }>();

api.openapi(
	createRoute({
		method: 'get',
		path: '/api/customers',
		responses: {
			200: {
				description: 'Fetch all customers',
				content: {
					'application/json': {
						schema: z.object({
							customers: z.array(customerSchema),
							ok: z.boolean(),
						}),
					},
				},
			},
		},
	}),
	async (c) => {
		const customers = await model.getCustomers(c.env.BILLIFY_KV);
		return c.json({ customers, ok: true });
	}
);

api.openapi(
	createRoute({
		method: 'post',
		path: '/api/customers',
		requestBody: {
			description: 'Create a new customer',
			content: {
				'application/json': {
					schema: customerSchema,
				},
			},
		},
		responses: {
			201: {
				description: 'Customer created successfully',
				content: {
					'application/json': {
						schema: z.object({
							customer: customerSchema,
							ok: z.boolean(),
						}),
					},
				},
			},
			422: {
				description: 'Unprocessable Entity',
				content: {
					'application/json': {
						schema: z.object({
							error: z.string(),
							ok: z.boolean(),
						}),
					},
				},
			},
		},
	}),
	async (c) => {
		const customerData = c.req.valid('json');
		const newCustomer = await model.createCustomer(c.env.BILLIFY_KV, customerData);
		if (!newCustomer) return c.json({ error: 'Cannot create new customer', ok: false }, 422);
		return c.json({ customer: newCustomer, ok: true }, 201);
	}
);

api.openapi(
	createRoute({
		method: 'get',
		path: '/api/customers/:id',
		responses: {
			200: {
				description: 'Fetch a single customer by ID',
				content: {
					'application/json': {
						schema: z.object({
							customer: customerSchema,
							ok: z.boolean(),
						}),
					},
				},
			},
			404: {
				description: 'Customer not found',
				content: {
					'application/json': {
						schema: z.object({
							error: z.string(),
							ok: z.boolean(),
						}),
					},
				},
			},
		},
	}),
	async (c) => {
		const id = c.req.param('id');
		const customer = await model.getCustomer(c.env.BILLIFY_KV, id);
		if (!customer) return c.json({ error: 'Not Found', ok: false }, 404);
		return c.json({ customer, ok: true });
	}
);

api.openapi(
	createRoute({
		method: 'put',
		path: '/api/customers/:id',
		requestBody: {
			description: 'Update a customer by ID',
			content: {
				'application/json': {
					schema: customerSchema.partial(),
				},
			},
		},
		responses: {
			200: {
				description: 'Customer updated successfully',
				content: {
					'application/json': {
						schema: z.object({
							ok: z.boolean(),
						}),
					},
				},
			},
			204: {
				description: 'Customer not found',
			},
		},
	}),
	async (c) => {
		const id = c.req.param('id');
		const customer = await model.getCustomer(c.env.BILLIFY_KV, id);
		if (!customer) return new Response(null, { status: 204 });
		const updatedData = c.req.valid('json');
		const success = await model.updateCustomer(c.env.BILLIFY_KV, id, updatedData);
		return c.json({ ok: success });
	}
);

api.openapi(
	createRoute({
		method: 'delete',
		path: '/api/customers/:id',
		responses: {
			200: {
				description: 'Customer deleted successfully',
				content: {
					'application/json': {
						schema: z.object({
							ok: z.boolean(),
						}),
					},
				},
			},
			204: {
				description: 'Customer not found',
			},
		},
	}),
	async (c) => {
		const id = c.req.param('id');
		const customer = await model.getCustomer(c.env.BILLIFY_KV, id);
		if (!customer) return new Response(null, { status: 204 });
		const success = await model.deleteCustomer(c.env.BILLIFY_KV, id);
		return c.json({ ok: success });
	}
);

export default api;
