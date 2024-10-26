/**
 * This is a template for a Scheduled Worker: a Worker that can run on a configurable interval:
 * https://developers.cloudflare.com/workers/platform/triggers/cron-triggers/
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Run `curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"` to see your worker in action
 */

import { Invoice } from './invoiceDO';
import { createInvoice } from './models/invoice';

export interface Env {
	KV: KVNamespace;
	InvoiceDO: DurableObjectNamespace<Invoice>;
	CUSTOMER_SUBSCRIPTIONS_SERVICE: string;
	NOTIFICATIONS_SERVICE: string;
	API_TOKEN: string;
}

type CustomerPlan = {
	name: string;
	billing_cycle: string;
	price: number;
};

const email = async (env: Env, to: string[], subject: string, emailBody: string) =>
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

const fetchCustomers = async (env: Env) => {
	const customers_resp = await fetch(`${env.CUSTOMER_SUBSCRIPTIONS_SERVICE}/api/customers`);
	const { customers }: any = await customers_resp.json();
	return customers;
};

const fetchSubscriptions = async (env: Env) => {
	const subscriptions_resp = await fetch(`${env.CUSTOMER_SUBSCRIPTIONS_SERVICE}/api/subscriptions`);
	const { subscriptions }: any = await subscriptions_resp.json();
	return subscriptions;
};

const updateCustomerBilling = async (env: Env, customerId: string, updateCustomerBody: any) => {
	await fetch(`${env.CUSTOMER_SUBSCRIPTIONS_SERVICE}/api/customers/${customerId}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${env.API_TOKEN}`,
		},
		body: JSON.stringify(updateCustomerBody),
	});
};

export { Invoice };

export default {
	// The scheduled handler is invoked at the interval set in our wrangler.toml's
	// [[triggers]] configuration.
	async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
		console.log(`trigger fired at ${controller.cron}: started`);
		try {
			const customers_resp = await fetch(`${env.CUSTOMER_SUBSCRIPTIONS_SERVICE}/api/customers`);
			const { customers }: any = await customers_resp.json();

			const subscriptions_resp = await fetch(`${env.CUSTOMER_SUBSCRIPTIONS_SERVICE}/api/subscriptions`);
			const { subscriptions }: any = await subscriptions_resp.json();

			// Approach 1: Use same logic for both monthly and annual subscribers with 1 scheduler
			customers
				.filter((customer: any) => customer.subscription_status === 'active') // check for active subscriptions
				.map(async (customer: any) => {
					const customerPlan: CustomerPlan = subscriptions.find((subscription: any) => subscription.id === customer.subscription_plan_id);
					console.log({ customer, customerPlan, date: new Date(), dateOk: customer.next_billing_date >= new Date() });

					// check if billing date has passed and is due (this check can also be moved to the filter function above)
					if (customer.next_billing_date >= new Date()) return; // if billing date is in the future then skip

					const billingCycles: any = {
						monthly: 1,
						yearly: 12,
					};

					const newInvoiceDueDate = new Date(); // TODO: what should be the due date, add specific days, or is it today then they pay
					const newInvoice = await createInvoice(env.KV, {
						customer_id: customer.id,
						amount: customerPlan.price,
						due_date: newInvoiceDueDate,
						payment_status: 'pending',
						payment_date: null,
					});

					// update the customer's billing date adding a month to the original
					const next_billing_date = new Date(
						new Date(customer.next_billing_date).setMonth(
							new Date(customer.next_billing_date).getMonth() + billingCycles[customerPlan.billing_cycle] || 1
						)
					);
					const updateCustomerBody = {
						next_billing_date,
					};

					await fetch(`${env.CUSTOMER_SUBSCRIPTIONS_SERVICE}/api/customers/${customer.id}`, {
						method: 'PUT',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${env.API_TOKEN}`,
						},
						body: JSON.stringify(updateCustomerBody),
					});

					const notification_resp = await email(
						env,
						[customer.email],
						`Your Billify ${customerPlan.billing_cycle.toUpperCase()} Invoice has been Generated!`,
						`Dear ${customer.name}, \nYour invoice for your ${customerPlan.billing_cycle} ${customerPlan.name} plan has been generated for the amount of ${customerPlan.price}, and is due on ${newInvoiceDueDate}!\n\nKindly use our payment API to process the payment.`
					);

					console.log({ notification_resp });

					return customer;
				});

			// Another Approach to take, if you want to schedule billing beginning of every month and year
			// switch (controller.cron) {
			// 	case '0 0 1 * *': // monthly cron interval
			// 		customers
			// 			.filter((customer: any) => customer.subscription_status === 'active') // check for active subscriptions
			// 			.map(async (customer: any) => {
			// 				const customerPlan = subscriptions.find((subscription: any) => subscription.id === customer.subscription_plan_id);
			// 				console.log({ customer, customerPlan, date: new Date(), dateOk: customer.next_billing_date >= new Date() });

			// 				// check for monthly plans customers
			// 				if (customerPlan?.billing_cycle !== 'monthly') return;

			// 				// check if billing date has passed and is due (this check can also be moved to the filter function above)
			// 				if (customer.next_billing_date >= new Date()) return; // if billing date is in the future then skip

			// 				const newInvoiceDueDate = new Date(); // TODO: what should be the due date, add specific days, or is it today then they pay
			// 				const newInvoice = await createInvoice(env.KV, {
			// 					customer_id: customer.id,
			// 					amount: customerPlan.price,
			// 					due_date: newInvoiceDueDate,
			// 					payment_status: 'pending',
			// 					payment_date: null,
			// 				});

			// 				const next_billing_date = new Date(
			// 					new Date(customer.next_billing_date).setMonth(new Date(customer.next_billing_date).getMonth() + 1)
			// 				);

			// 				// update the customer's billing date adding a month to the original
			// 				const updateCustomerBody = {
			// 					next_billing_date,
			// 				};
			// 				console.log({ updateCustomerBody });

			// 				await fetch(`${env.CUSTOMER_SUBSCRIPTIONS_SERVICE}/api/customers/${customer.id}`, {
			// 					method: 'PUT',
			// 					headers: {
			// 						'Content-Type': 'application/json',
			// 						Authorization: `Bearer ${env.API_TOKEN}`,
			// 					},
			// 					body: JSON.stringify(updateCustomerBody),
			// 				});
			// 				console.log({ CUSTOMER_SUBSCRIPTIONS_SERVICE: env.CUSTOMER_SUBSCRIPTIONS_SERVICE });

			// 				const notification_resp = await email(
			// 					env,
			// 					[customer.email],
			// 					`Your Billify ${customerPlan.billing_cycle.toUpperCase()} Invoice has been Generated!`,
			// 					`Dear ${customer.name}, \nYour invoice for your ${customerPlan.billing_cycle} ${customerPlan.name} plan has been generated for the amount of ${customerPlan.price}, and is due on ${newInvoiceDueDate}!\n\nKindly use our payment API to process the payment.`
			// 				);

			// 				console.log({ notification_resp });

			// 				return customer;
			// 			});

			// 		break;
			// 	case '0 0 1 1 *': // yearly cron interval
			// 		// same as the monthly cron interval but with adjusting "monthly" and and +12
			// 		break;
			// }
		} catch (error) {
			console.log({ error });
		}

		console.log(`trigger fired at ${controller.cron}: done`);
	},

	// TODO: create an endpoint to list customers invoices /api/customers/:id/invoices
	async fetch(): Promise<any> {},
};

// let id: DurableObjectId = env.InvoiceDO.idFromName(customer.name); // assuming customer name is unique
// // This stub creates a communication channel with the Durable Object instance
// // The Durable Object constructor will be invoked upon the first call for a given id
// let stub = env.InvoiceDO.get(id);

// const invoice = await stub.generateInvoice(customer);
// const incremented = await stub.increment();
