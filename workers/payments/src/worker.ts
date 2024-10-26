import { DurableObject } from 'cloudflare:workers';
import { PaymentDO } from './paymentDO';
import app from './app';

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

export default {
	// TODO: Schedule reattempting failed payments
	async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {},
	// TODO: Provide API endpoints to pay and list past payments
	async fetch(request: Request, env: any) {
		return await app.fetch(request, env);
	},
} satisfies ExportedHandler<Env>;
