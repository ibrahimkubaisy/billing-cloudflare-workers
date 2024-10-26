import { PaymentInput } from './payment-api';
import { createPayment } from './models/payment';
import { Env } from './worker';

export const fetchFailedInvoices = async (env: Env) => {
	const invoices_resp = await fetch(`${env.INVOICES_SERVICE}/api/invoices/failed`);
	const { invoices }: any = await invoices_resp.json();
	return invoices;
};

export const reportSuccessfulPayment = async (env: Env, invoiceId: string) => {
	await fetch(`${env.INVOICES_SERVICE}/api/invoices/${invoiceId}/pay`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${env.API_TOKEN}`,
		},
	});
};

export const reportFailedPayment = async (env: Env, invoiceId: string) => {
	await fetch(`${env.INVOICES_SERVICE}/api/invoices/${invoiceId}/failed-payment`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${env.API_TOKEN}`,
		},
	});
};

export const processPayment = async (env: Env, paymentData: PaymentInput) => {
	const newPayment = await createPayment(env.BILLIFY_KV, paymentData);

	if (!newPayment) {
		return false;
	}

	if (newPayment.payment_status === 'paid') {
		await reportSuccessfulPayment(env, paymentData.invoice_id);
	} else if (newPayment.payment_status === 'failed') {
		await reportFailedPayment(env, paymentData.invoice_id);
	}

	return newPayment;
};
