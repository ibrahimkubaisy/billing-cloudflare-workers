import { DurableObject } from 'cloudflare:workers';
import { Payment as PaymentDO } from './paymentDO';
import app from './app';
import { fetchFailedInvoices, processPayment } from './utils';
import { Payment as PaymentModel, getInvoicePayments } from './models/payment';

/**
 * Welcome to Cloudflare Workers! This is your first Durable Objects application.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your Durable Object in action
 * - Run `npm run deploy` to publish your application
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/durable-objects
 */

export interface Env {
	BILLIFY_KV: KVNamespace;
	PaymentDO: DurableObjectNamespace<PaymentDO>;
	INVOICES_SERVICE: string;
	CUSTOMER_SUBSCRIPTIONS_SERVICE: string;
	NOTIFICATIONS_SERVICE: string;
	API_TOKEN: string;
}

export interface Invoice {
	id: string;
	customer_id: string;
	amount: number;
	due_date: Date;
	payment_status: 'pending' | 'paid' | 'failed';
	payment_date: Date | null;
}

/** A Durable Object's behavior is defined in an exported Javascript class */
export class MyDurableObject extends DurableObject {
	/**
	 * The constructor is invoked once upon creation of the Durable Object, i.e. the first call to
	 * 	`DurableObjectStub::get` for a given identifier (no-op constructors can be omitted)
	 *
	 * @param ctx - The interface for interacting with Durable Object state
	 * @param env - The interface to reference bindings declared in wrangler.toml
	 */
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}

	/**
	 * The Durable Object exposes an RPC method sayHello which will be invoked when when a Durable
	 *  Object instance receives a request from a Worker via the same method invocation on the stub
	 *
	 * @param name - The name provided to a Durable Object instance from a Worker
	 * @returns The greeting to be sent back to the Worker
	 */
	async sayHello(name: string): Promise<string> {
		return `Hello, ${name}!`;
	}
}

export { PaymentDO as Payment };

export default {
	// Schedule reattempting failed payments
	async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
		// Fetch all invoices with status "failed"
		const failedInvoices = await fetchFailedInvoices(env);

		// Reattempt payments manually
		failedInvoices.map(async (failedInvoice: Invoice) => {
			// Fetch last payment with this invoice id to grab the other payment details to reattempt
			const invoicePayments: PaymentModel[] = await getInvoicePayments(env.BILLIFY_KV, failedInvoice.id);

			if (invoicePayments?.length) return null;

			// Sort by payment_date in descending order and get the first one (latest)
			const lastPaymentInvoice = invoicePayments.sort((a, b) => {
				return (b.payment_date as Date).getTime() - (a.payment_date as Date).getTime();
			})[0];

			console.log(
				`Reattempting to process ${lastPaymentInvoice.id} payment since ${lastPaymentInvoice.payment_date} for amount of (${lastPaymentInvoice.amount}) with payment method: ${lastPaymentInvoice.payment_method}.`
			);

			const newPayment = await processPayment(env, {
				invoice_id: lastPaymentInvoice.invoice_id,
				amount: lastPaymentInvoice.amount,
				payment_method: lastPaymentInvoice.payment_method,
			});

			if (!newPayment) {
				console.log(`Error during processing new payment`);
				return null;
			}

			console.log(
				`New payment for invoice ${newPayment.invoice_id} with status: ${newPayment.payment_status} at ${newPayment.payment_date}`
			);
		});
	},
	// Provide API endpoints to pay and list past payments
	async fetch(request: Request, env: any) {
		return await app.fetch(request, env);
	},
} satisfies ExportedHandler<Env>;
