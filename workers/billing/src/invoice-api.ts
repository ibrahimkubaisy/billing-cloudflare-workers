import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import * as model from './models/invoice';
import { Env } from './worker';

const invoiceSchema = z.object({
	customer_id: z.string().min(5),
	amount: z.number(), // Ensure valid email format
	due_date: z.preprocess((val) => (typeof val === 'string' ? new Date(val) : val), z.date()),
	payment_status: z.enum(['pending', 'paid', 'failed']),
	payment_date: z.preprocess((val) => (typeof val === 'string' ? new Date(val) : val), z.date().nullable()),
});

type InvoiceInput = z.infer<typeof invoiceSchema>;

const api = new Hono<{ Bindings: Env }>();

// Fetch all invoices
api.get('/', async (c) => {
	const invoices = await model.getInvoices(c.env.BILLIFY_KV);
	return c.json({ invoices: invoices, ok: true });
});

// Fetch all failed invoices
api.get('/failed', async (c) => {
	const invoices = await model.getInvoices(c.env.BILLIFY_KV);
	const failedInvoices = invoices?.filter((invoice) => invoice.payment_status === 'failed');
	return c.json({ invoices: failedInvoices, ok: true });
});

// Fetch all invoices per customer id
api.get('/customer/:id', async (c) => {
	const id = c.req.param('id');
	const invoices = await model.getCustomerInvoices(c.env.BILLIFY_KV, id);
	return c.json({ invoices: invoices, ok: true });
});

// Create a new invoice
api.post('/', zValidator('json', invoiceSchema), async (c) => {
	const invoiceData: InvoiceInput = c.req.valid('json');

	const newInvoice = await model.createInvoice(c.env.BILLIFY_KV, invoiceData);

	if (!newInvoice) {
		return c.json({ error: 'Cannot create new invoice', ok: false }, 422);
	}

	return c.json({ invoice: newInvoice, ok: true }, 201);
});

// Fetch a single invoice by ID
api.get('/:id', async (c) => {
	const id = c.req.param('id');
	const invoice = await model.getInvoice(c.env.BILLIFY_KV, id);

	if (!invoice) {
		return c.json({ error: 'Not Found', ok: false }, 404);
	}
	return c.json({ invoice: invoice, ok: true });
});

// Update a invoice by ID
api.put('/:id', zValidator('json', invoiceSchema.partial()), async (c) => {
	const id = c.req.param('id');
	const invoice = await model.getInvoice(c.env.BILLIFY_KV, id);

	if (!invoice) {
		// 204 No Content
		return new Response(null, { status: 204 });
	}

	const updatedData: Partial<InvoiceInput> = c.req.valid('json');
	const success = await model.updateInvoice(c.env.BILLIFY_KV, id, updatedData);

	return c.json({ ok: success });
});

// Pay an invoice by ID
api.post('/:id/pay', zValidator('json', invoiceSchema.partial()), async (c) => {
	const id = c.req.param('id');
	const invoice = await model.getInvoice(c.env.BILLIFY_KV, id);

	if (!invoice) {
		// 204 No Content
		return new Response(null, { status: 204 });
	}

	const success = await model.updateInvoice(c.env.BILLIFY_KV, id, { payment_status: 'paid', payment_date: new Date() });

	return c.json({ ok: success });
});

// Payment failed for an invoice by ID
api.post('/:id/failed-payment', zValidator('json', invoiceSchema.partial()), async (c) => {
	const id = c.req.param('id');
	const invoice = await model.getInvoice(c.env.BILLIFY_KV, id);

	if (!invoice) {
		// 204 No Content
		return new Response(null, { status: 204 });
	}

	// TODO: do we add the failed payment date in the payment_date or is this field only for successful payments?
	const updatedInvoice = await model.updateInvoice(c.env.BILLIFY_KV, id, { payment_status: 'failed', payment_date: null });

	return c.json({ invoice: updatedInvoice });
});

// Invoices should be safe against deletions
// Delete a invoice by ID
// api.delete('/:id', async (c) => {
// 	const id = c.req.param('id');
// 	const invoice = await model.getInvoice(c.env.BILLIFY_KV, id);

// 	if (!invoice) {
// 		// 204 No Content
// 		return new Response(null, { status: 204 });
// 	}

// 	const success = await model.deleteInvoice(c.env.BILLIFY_KV, id);

// 	return c.json({ ok: success });
// });

export default api;
