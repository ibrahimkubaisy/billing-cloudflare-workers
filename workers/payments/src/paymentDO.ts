import { DurableObject } from 'cloudflare:workers';

export class Payment extends DurableObject {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}
}
