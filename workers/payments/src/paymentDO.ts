import { DurableObject } from 'cloudflare:workers';

export class PaymentDO extends DurableObject {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}
}
