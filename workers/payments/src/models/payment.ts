const PREFIX = 'v1:payment:';

declare global {
	interface Crypto {
		randomUUID(): string;
	}
}

// Updated Payment interface with specified fields
export interface Payment {
	id: string;
	invoice_id: string;
	amount: number;
	payment_method: 'Credit Card' | 'PayPal' | 'Binance' | 'BenefitPay' | 'Mada';
	payment_date: Date | null;
}

export type Param = {
	invoice_id: string;
	amount: number;
	payment_method: 'Credit Card' | 'PayPal' | 'Binance' | 'BenefitPay' | 'Mada';
	payment_date: Date | null;
};

const generateID = (key: string) => {
	return `${PREFIX}${key}`;
};

// Fetch all payments
export const getPayments = async (KV: KVNamespace): Promise<Payment[] | undefined> => {
	try {
		const list = await KV.list({ prefix: PREFIX });
		const keys = list.keys;

		const payments: Payment[] = await Promise.all(
			keys.map(async (key) => {
				const value = await KV.get(key.name);
				return value ? JSON.parse(value) : null;
			})
		);

		const validPayments = payments.filter(Boolean) as Payment[];
		return validPayments;
	} catch (error) {
		return undefined;
	}
};

// Fetch all payments
export const getInvoicePayments = async (KV: KVNamespace, invoiceId: string): Promise<Payment[] | undefined> => {
	try {
		const list = await KV.list({ prefix: PREFIX });
		const keys = list.keys;

		const payments: Payment[] = await Promise.all(
			keys.map(async (key) => {
				const value = await KV.get(key.name);
				return value ? JSON.parse(value) : null;
			})
		);

		const invoicePayments = payments.filter(Boolean).filter((payment) => payment.invoice_id === invoiceId) as Payment[];
		return invoicePayments;
	} catch (error) {
		return undefined;
	}
};

// Fetch a single payment by ID
export const getPayment = async (KV: KVNamespace, id: string): Promise<Payment | undefined> => {
	try {
		const value = await KV.get(generateID(id));
		return value ? JSON.parse(value) : undefined;
	} catch (error) {
		return undefined;
	}
};

// Create a new payment
export const createPayment = async (KV: KVNamespace, param: Param): Promise<Payment | undefined> => {
	try {
		// Ensure all required fields are provided
		if (!(param && param.invoice_id && param.amount && param.payment_method)) return undefined;

		const id = crypto.randomUUID();
		const newPayment: Payment = {
			id: id,
			invoice_id: param.invoice_id,
			amount: param.amount,
			payment_method: param.payment_method,
			payment_date: new Date(),
		};

		await KV.put(generateID(id), JSON.stringify(newPayment));
		return newPayment;
	} catch (error) {
		return undefined;
	}
};

// Payments should be Read-only
// Update an existing payment
// export const updatePayment = async (KV: KVNamespace, id: string, param: Partial<Param>): Promise<Payment | null> => {
// 	try {
// 		const payment = await getPayment(KV, id);
// 		if (!payment) return null;

// 		// Update fields only if they are provided in the param
// 		payment.invoice_id = param.invoice_id ?? payment.invoice_id;
// 		payment.amount = param.amount ?? payment.amount;
// 		payment.payment_method = param.payment_method ?? payment.payment_method;
// 		payment.payment_date = new Date();

// 		await KV.put(generateID(id), JSON.stringify(payment));
// 		return payment;
// 	} catch (error) {
// 		return null;
// 	}
// };

// Delete a payment by ID
// export const deletePayment = async (KV: KVNamespace, id: string): Promise<boolean> => {
// 	try {
// 		const payment = await getPayment(KV, id);

// 		if (!payment) return false;

// 		await KV.delete(generateID(id));

// 		return true;
// 	} catch (error) {
// 		return false;
// 	}
// };
