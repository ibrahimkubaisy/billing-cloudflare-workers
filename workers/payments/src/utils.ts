import { Context } from 'hono';

export const reportSuccessfulPayment = async (c: Context, invoiceId: string) => {
	await fetch(`${c.env.INVOICES_SERVICE}/api/invoices/${invoiceId}/pay`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${c.env.API_TOKEN}`,
		},
	});
};

export const reportFailedPayment = async (c: Context, invoiceId: string) => {
	await fetch(`${c.env.INVOICES_SERVICE}/api/invoices/${invoiceId}/failed-payment`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${c.env.API_TOKEN}`,
		},
	});
};
