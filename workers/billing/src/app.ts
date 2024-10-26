import { Hono } from 'hono';
import { Env } from './worker';
import invoiceApi from './invoice-api';

const app = new Hono<{ Bindings: Env }>();

app.route('/api/invoices', invoiceApi);

export default app;
