import { Env } from './worker';

export const email = async (env: Env, to: string[], subject: string, emailBody: string) =>
	await fetch(`${env.NOTIFICATIONS_SERVICE}/api/email`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${env.API_TOKEN}`,
		},
		body: JSON.stringify({
			to,
			subject,
			emailBody,
		}),
	});

export const fetchCustomers = async (env: Env) => {
	const customers_resp = await fetch(`${env.CUSTOMER_SUBSCRIPTIONS_SERVICE}/api/customers`);
	const { customers }: any = await customers_resp.json();
	return customers;
};

export const fetchCustomer = async (env: Env, customerId: string) => {
	const customer_resp = await fetch(`${env.CUSTOMER_SUBSCRIPTIONS_SERVICE}/api/customers/${customerId}`);
	const { customer }: any = await customer_resp.json();
	return customer;
};

export const fetchSubscriptions = async (env: Env) => {
	const subscriptions_resp = await fetch(`${env.CUSTOMER_SUBSCRIPTIONS_SERVICE}/api/subscriptions`);
	const { subscriptions }: any = await subscriptions_resp.json();
	return subscriptions;
};

export const updateCustomerBilling = async (env: Env, customerId: string, updateCustomerBody: any) => {
	await fetch(`${env.CUSTOMER_SUBSCRIPTIONS_SERVICE}/api/customers/${customerId}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${env.API_TOKEN}`,
		},
		body: JSON.stringify(updateCustomerBody),
	});
};
