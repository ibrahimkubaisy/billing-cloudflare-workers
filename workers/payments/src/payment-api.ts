import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import * as model from './models/payment';
import { Env } from './worker';
import {
	processPayment,
	// email,
	// reportFailedPayment,
	// reportSuccessfulPayment,
} from './utils';

const paymentSchema = z.object({
	invoice_id: z.string().min(5),
	amount: z.number(), // Ensure valid email format
	payment_method: z.enum(['Credit Card', 'PayPal', 'Binance', 'BenefitPay', 'Mada']),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

const api = new Hono<{ Bindings: Env }>();

// Fetch all payments
api.get('/payments', async (c) => {
	const payments = await model.getPayments(c.env.BILLIFY_KV);
	return c.json({ payments: payments, ok: true });
});

// Fetch all payments per invoice id
api.get('/invoice/:id/payments', async (c) => {
	const id = c.req.param('id');
	const payments = await model.getInvoicePayments(c.env.BILLIFY_KV, id);
	return c.json({ payments: payments, ok: true });
});

// Create a new payment
api.post('/invoice/:id/payment', zValidator('json', paymentSchema), async (c) => {
	const paymentData: PaymentInput = c.req.valid('json');

	const newPayment = await processPayment(c.env, paymentData);

	if (!newPayment) {
		return c.json({ error: 'Cannot create new payment', ok: false }, 422);
	}

	return c.json({ payment: newPayment, ok: true }, 201);
});

// Fetch a single payment by ID
api.get('/payments/:id', async (c) => {
	const id = c.req.param('id');
	const payment = await model.getPayment(c.env.BILLIFY_KV, id);

	if (!payment) {
		return c.json({ error: 'Not Found', ok: false }, 404);
	}
	return c.json({ payment: payment, ok: true });
});

// Payments should be Read-only
// Update a payment by ID
// api.put('/:id', zValidator('json', paymentSchema.partial()), async (c) => {
// 	const id = c.req.param('id');
// 	const payment = await model.getPayment(c.env.BILLIFY_KV, id);

// 	if (!payment) {
// 		// 204 No Content
// 		return new Response(null, { status: 204 });
// 	}

// 	const updatedData: Partial<PaymentInput> = c.req.valid('json');
// 	const success = await model.updatePayment(c.env.BILLIFY_KV, id, updatedData);

// 	return c.json({ ok: success });
// });

// Delete a payment by ID
// api.delete('/:id', async (c) => {
// 	const id = c.req.param('id');
// 	const payment = await model.getPayment(c.env.BILLIFY_KV, id);

// 	if (!payment) {
// 		// 204 No Content
// 		return new Response(null, { status: 204 });
// 	}

// 	const success = await model.deletePayment(c.env.BILLIFY_KV, id);

// 	return c.json({ ok: success });
// });

export default api;
