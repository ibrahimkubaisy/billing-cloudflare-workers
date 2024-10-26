const PREFIX = 'v1:customer:';

declare global {
	interface Crypto {
		randomUUID(): string;
	}
}

// Updated Customer interface with specified fields
export interface Customer {
	id: string;
	name: string;
	email: string;
	subscription_plan_id: string;
	subscription_status: 'active' | 'cancelled' | 'paused';
}

export type Param = {
	name: string;
	email: string;
	subscription_plan_id: string;
	subscription_status: 'active' | 'cancelled' | 'paused';
};

const generateID = (key: string) => {
	return `${PREFIX}${key}`;
};

// Fetch all customers
export const getCustomers = async (KV: KVNamespace): Promise<Customer[] | undefined> => {
	try {
		const list = await KV.list({ prefix: PREFIX });
		const keys = list.keys;

		const customers: Customer[] = await Promise.all(
			keys.map(async (key) => {
				const value = await KV.get(key.name);
				return value ? JSON.parse(value) : null;
			})
		);

		const validCustomers = customers.filter(Boolean) as Customer[];
		return validCustomers;
	} catch (error) {
		return undefined;
	}
};

// Fetch a single customer by ID
export const getCustomer = async (KV: KVNamespace, id: string): Promise<Customer | undefined> => {
	try {
		const value = await KV.get(generateID(id));
		return value ? JSON.parse(value) : undefined;
	} catch (error) {
		return undefined;
	}
};

// Create a new customer
export const createCustomer = async (KV: KVNamespace, param: Param): Promise<Customer | undefined> => {
	try {
		// Ensure all required fields are provided
		if (!(param && param.name && param.email && param.subscription_plan_id && param.subscription_status)) return undefined;

		const id = crypto.randomUUID();
		const newCustomer: Customer = {
			id: id,
			name: param.name,
			email: param.email,
			subscription_plan_id: param.subscription_plan_id,
			subscription_status: param.subscription_status,
		};

		await KV.put(generateID(id), JSON.stringify(newCustomer));
		return newCustomer;
	} catch (error) {
		return undefined;
	}
};

// Update an existing customer
export const updateCustomer = async (KV: KVNamespace, id: string, param: Partial<Param>): Promise<boolean> => {
	try {
		const customer = await getCustomer(KV, id);
		if (!customer) return false;

		// Update fields only if they are provided in the param
		customer.name = param.name ?? customer.name;
		customer.email = param.email ?? customer.email;
		customer.subscription_plan_id = param.subscription_plan_id ?? customer.subscription_plan_id;
		customer.subscription_status = param.subscription_status ?? customer.subscription_status;

		await KV.put(generateID(id), JSON.stringify(customer));
		return true;
	} catch (error) {
		return false;
	}
};

// Delete a customer by ID
export const deleteCustomer = async (KV: KVNamespace, id: string): Promise<boolean> => {
	try {
		const customer = await getCustomer(KV, id);

		if (!customer) return false;

		await KV.delete(generateID(id));

		return true;
	} catch (error) {
		return false;
	}
};
