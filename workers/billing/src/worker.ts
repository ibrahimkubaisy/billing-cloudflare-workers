/**
 * This is a template for a Scheduled Worker: a Worker that can run on a configurable interval:
 * https://developers.cloudflare.com/workers/platform/triggers/cron-triggers/
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Run `curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"` to see your worker in action
 */

import { Invoice } from './invoice';

export interface Env {
	KV: KVNamespace;
	InvoiceDO: DurableObjectNamespace;
	CUSTOMER_SUBSCRIPTIONS_SERVICE: string;
}

export { Invoice };

export default {
	// The scheduled handler is invoked at the interval set in our wrangler.toml's
	// [[triggers]] configuration.
	async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
		console.log(`trigger fired at ${controller.cron}: started`);

		const response = await fetch(`${env.CUSTOMER_SUBSCRIPTIONS_SERVICE}/api/customers`);

		switch (controller.cron) {
			case '0 0 1 * *': // monthly cron interval
				const json: any = await response.json();

				json.customers.map((customer: any) => {
					let id: DurableObjectId = env.InvoiceDO.idFromName(customer.name); // assuming customer name is unique

					// This stub creates a communication channel with the Durable Object instance
					// The Durable Object constructor will be invoked upon the first call for a given id
					let stub = env.InvoiceDO.get(id);

					return customer;
				});

				console.log({ json });
				break;
			case '0 0 1 1 *': // yearly cron interval
				break;
		}

		console.log(`trigger fired at ${controller.cron}: done`);
	},
};
