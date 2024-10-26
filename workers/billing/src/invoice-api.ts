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
	const invoices = await model.getInvoices(c.env.KV);
	return c.json({ invoices: invoices, ok: true });
});

// Create a new invoice
api.post('/', zValidator('json', invoiceSchema), async (c) => {
	const invoiceData: InvoiceInput = c.req.valid('json');

	const newInvoice = await model.createInvoice(c.env.KV, invoiceData);

	if (!newInvoice) {
		return c.json({ error: 'Cannot create new invoice', ok: false }, 422);
	}

	return c.json({ invoice: newInvoice, ok: true }, 201);
});

// Fetch a single invoice by ID
api.get('/:id', async (c) => {
	const id = c.req.param('id');
	const invoice = await model.getInvoice(c.env.KV, id);

	if (!invoice) {
		return c.json({ error: 'Not Found', ok: false }, 404);
	}
	return c.json({ invoice: invoice, ok: true });
});

// Update a invoice by ID
api.put('/:id', zValidator('json', invoiceSchema.partial()), async (c) => {
	const id = c.req.param('id');
	const invoice = await model.getInvoice(c.env.KV, id);

	if (!invoice) {
		// 204 No Content
		return new Response(null, { status: 204 });
	}

	const updatedData: Partial<InvoiceInput> = c.req.valid('json');
	const success = await model.updateInvoice(c.env.KV, id, updatedData);

	return c.json({ ok: success });
});

// Delete a invoice by ID
// api.delete('/:id', async (c) => {
// 	const id = c.req.param('id');
// 	const invoice = await model.getInvoice(c.env.KV, id);

// 	if (!invoice) {
// 		// 204 No Content
// 		return new Response(null, { status: 204 });
// 	}

// 	const success = await model.deleteInvoice(c.env.KV, id);

// 	return c.json({ ok: success });
// });

export default api;
