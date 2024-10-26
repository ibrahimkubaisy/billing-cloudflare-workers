import { DurableObject } from 'cloudflare:workers';

export class Invoice extends DurableObject {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}

	async generateInvoice() {
		let value = (await this.ctx.storage.get('value')) || undefined;

		if (value === undefined) await this.ctx.storage.put('value', value);

		return value;
	}

	async increment(amount = 1) {
		let value: number = (await this.ctx.storage.get('value')) || 0;
		value += amount;
		await this.ctx.storage.put('value', value);
		return value;
	}

	async decrement(amount = 1) {
		let value: number = (await this.ctx.storage.get('value')) || 0;
		value -= amount;
		await this.ctx.storage.put('value', value);
		return value;
	}
}
