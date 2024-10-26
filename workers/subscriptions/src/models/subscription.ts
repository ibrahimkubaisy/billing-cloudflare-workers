const PREFIX = 'v1:subscription:';

declare global {
	interface Crypto {
		randomUUID(): string;
	}
}

export interface Subscription {
	id: string;
	name: string;
	billing_cycle: 'monthly' | 'yearly';
	price: number;
	status: 'active' | 'inactive';
}

export type Param = {
	name: string;
	billing_cycle: 'monthly' | 'yearly';
	price: number;
	status: 'active' | 'inactive';
};

const generateID = (key: string) => {
	return `${PREFIX}${key}`;
};

// Fetch all subscriptions
export const getSubscriptions = async (KV: KVNamespace): Promise<Subscription[] | undefined> => {
	try {
		const list = await KV.list({ prefix: PREFIX });
		const keys = list.keys;

		const subscriptions: Subscription[] = await Promise.all(
			keys.map(async (key) => {
				const value = await KV.get(key.name);
				return value ? JSON.parse(value) : null;
			})
		);

		const validSubscriptions = subscriptions.filter(Boolean) as Subscription[];
		return validSubscriptions;
	} catch (error) {
		return undefined;
	}
};

// Fetch a single subscription by ID
export const getSubscription = async (KV: KVNamespace, id: string): Promise<Subscription | undefined> => {
	const value = await KV.get(generateID(id));
	return value ? JSON.parse(value) : undefined;
};

// Create a new subscription
export const createSubscription = async (KV: KVNamespace, param: Param): Promise<Subscription | undefined> => {
	try {
		// Ensure all required fields are provided
		if (!(param && param.name && param.billing_cycle && param.price >= 0 && param.status)) return undefined;

		const id = crypto.randomUUID();
		const newSubscription: Subscription = {
			id: id,
			name: param.name,
			billing_cycle: param.billing_cycle,
			price: param.price,
			status: param.status,
		};

		await KV.put(generateID(id), JSON.stringify(newSubscription));

		return newSubscription;
	} catch (error) {
		return undefined;
	}
};

// Update an existing subscription
export const updateSubscription = async (KV: KVNamespace, id: string, param: Partial<Param>): Promise<boolean> => {
	try {
		const subscription = await getSubscription(KV, id);
		if (!subscription) return false;

		// Update fields only if they are provided in the param
		subscription.name = param.name ?? subscription.name;
		subscription.billing_cycle = param.billing_cycle ?? subscription.billing_cycle;
		subscription.price = param.price ?? subscription.price;
		subscription.status = param.status ?? subscription.status;

		await KV.put(generateID(id), JSON.stringify(subscription));

		return true;
	} catch (error) {
		return false;
	}
};

// Delete a subscription by ID
export const deleteSubscription = async (KV: KVNamespace, id: string): Promise<boolean> => {
	try {
		const subscription = await getSubscription(KV, id);
		if (!subscription) return false;
		await KV.delete(generateID(id));
		return true;
	} catch (error) {
		return false;
	}
};
