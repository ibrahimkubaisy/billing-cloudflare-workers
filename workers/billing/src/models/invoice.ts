const PREFIX = 'v1:invoice:';

declare global {
	interface Crypto {
		randomUUID(): string;
	}
}

// Updated Invoice interface with specified fields
export interface Invoice {
	id: string;
	customer_id: string;
	amount: number;
	due_date: Date;
	payment_status: 'pending' | 'paid' | 'failed';
	payment_date: Date | null;
}

export type Param = {
	customer_id: string;
	amount: number;
	due_date: Date;
	payment_status: 'pending' | 'paid' | 'failed';
	payment_date: Date | null;
};

const generateID = (key: string) => {
	return `${PREFIX}${key}`;
};

// Fetch all invoices
export const getInvoices = async (KV: KVNamespace): Promise<Invoice[] | undefined> => {
	try {
		const list = await KV.list({ prefix: PREFIX });
		const keys = list.keys;

		const invoices: Invoice[] = await Promise.all(
			keys.map(async (key) => {
				const value = await KV.get(key.name);
				return value ? JSON.parse(value) : null;
			})
		);

		const validInvoices = invoices.filter(Boolean) as Invoice[];
		return validInvoices;
	} catch (error) {
		return undefined;
	}
};

// Fetch all invoices
export const getCustomerInvoices = async (KV: KVNamespace, customerId: string): Promise<Invoice[] | undefined> => {
	try {
		const list = await KV.list({ prefix: PREFIX });
		const keys = list.keys;

		const invoices: Invoice[] = await Promise.all(
			keys.map(async (key) => {
				const value = await KV.get(key.name);
				return value ? JSON.parse(value) : null;
			})
		);

		const customerInvoices = invoices.filter(Boolean).filter((invoice) => invoice.customer_id === customerId) as Invoice[];
		return customerInvoices;
	} catch (error) {
		return undefined;
	}
};

// Fetch a single invoice by ID
export const getInvoice = async (KV: KVNamespace, id: string): Promise<Invoice | undefined> => {
	try {
		const value = await KV.get(generateID(id));
		return value ? JSON.parse(value) : undefined;
	} catch (error) {
		return undefined;
	}
};

// Create a new invoice
export const createInvoice = async (KV: KVNamespace, param: Param): Promise<Invoice | undefined> => {
	try {
		// Ensure all required fields are provided
		if (!(param && param.customer_id && param.amount && param.due_date && param.payment_status)) return undefined;

		const id = crypto.randomUUID();
		const newInvoice: Invoice = {
			id: id,
			customer_id: param.customer_id,
			amount: param.amount,
			due_date: param.due_date,
			payment_status: param.payment_status,
			payment_date: null,
		};

		await KV.put(generateID(id), JSON.stringify(newInvoice));
		return newInvoice;
	} catch (error) {
		return undefined;
	}
};

// Update an existing invoice
export const updateInvoice = async (KV: KVNamespace, id: string, param: Partial<Param>): Promise<boolean> => {
	try {
		const invoice = await getInvoice(KV, id);
		if (!invoice) return false;

		// Update fields only if they are provided in the param
		invoice.customer_id = param.customer_id ?? invoice.customer_id;
		invoice.amount = param.amount ?? invoice.amount;
		invoice.due_date = param.due_date ?? invoice.due_date;
		invoice.payment_status = param.payment_status ?? invoice.payment_status;
		invoice.payment_date = param.payment_date ?? invoice.payment_date;

		await KV.put(generateID(id), JSON.stringify(invoice));
		return true;
	} catch (error) {
		return false;
	}
};

// Delete a invoice by ID
// export const deleteInvoice = async (KV: KVNamespace, id: string): Promise<boolean> => {
// 	try {
// 		const invoice = await getInvoice(KV, id);

// 		if (!invoice) return false;

// 		await KV.delete(generateID(id));

// 		return true;
// 	} catch (error) {
// 		return false;
// 	}
// };
