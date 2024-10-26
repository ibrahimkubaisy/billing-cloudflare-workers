import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Bindings } from './bindings';
import * as model from './models/subscription';

const subscriptionSchema = z.object({
	name: z.string().min(1),
	billing_cycle: z.enum(['monthly', 'yearly']),
	price: z.number().positive(), // Ensure price is a positive number
	status: z.enum(['active', 'inactive']),
});

type SubscriptionInput = z.infer<typeof subscriptionSchema>;

const api = new Hono<{ Bindings: Bindings }>();

api.get('/', async (c) => {
	const subscriptions = await model.getSubscriptions(c.env.BILLIFY_KV);
	return c.json({ subscriptions: subscriptions, ok: true });
});

api.post('/', zValidator('json', subscriptionSchema), async (c) => {
	const param: SubscriptionInput = c.req.valid('json');

	const newSubscription = await model.createSubscription(c.env.BILLIFY_KV, param as model.Param);

	if (!newSubscription) {
		return c.json({ error: 'Can not create new subscription', ok: false }, 422);
	}

	return c.json({ subscription: newSubscription, ok: true }, 201);
});

api.get('/:id', async (c) => {
	const id = c.req.param('id');
	const subscription = await model.getSubscription(c.env.BILLIFY_KV, id);
	if (!subscription) {
		return c.json({ error: 'Not Found', ok: false }, 404);
	}
	return c.json({ subscription: subscription, ok: true });
});

api.put('/:id', zValidator('json', subscriptionSchema.partial()), async (c) => {
	const id = c.req.param('id');

	const subscription = await model.getSubscription(c.env.BILLIFY_KV, id);
	if (!subscription) {
		// 204 No Content
		return new Response(null, { status: 204 });
	}

	const updatedData: Partial<SubscriptionInput> = c.req.valid('json');
	const success = await model.updateSubscription(c.env.BILLIFY_KV, id, updatedData);

	return c.json({ ok: success });
});

api.delete('/:id', async (c) => {
	const id = c.req.param('id');
	const subscription = await model.getSubscription(c.env.BILLIFY_KV, id);
	if (!subscription) {
		// 204 No Content
		return new Response(null, { status: 204 });
	}
	const success = await model.deleteSubscription(c.env.BILLIFY_KV, id);
	return c.json({ ok: success });
});

export default api;
