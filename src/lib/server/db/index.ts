import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';

// Local dev (vite) uses Docker Postgres via DATABASE_URL.
// Production (Cloudflare Workers) connects straight to the Postgres origin via the
// DATABASE_URL secret — no Hyperdrive in the middle.
function resolveDbUrl(): string {
	const url = env.DATABASE_URL;
	if (!url) throw new Error('DATABASE_URL is not set');
	return url;
}

type UnsafeResult = Promise<unknown> & {
	values: (...args: unknown[]) => Promise<unknown>;
};

// Cloudflare Workers forbid reusing an I/O object created in the context of a different
// request. The module-level postgres client keeps a single socket per isolate (`max: 1`),
// so the FIRST statement of every subsequent request is rejected with "Cannot perform I/O
// on behalf of a different request" before anything is sent to the server. postgres.js
// reconnects automatically and a fresh socket is created in the current request's context,
// so retrying once makes the query succeed. Statements after the first one reuse the socket
// within the same request. Server-side failures carry a 5-char SQLSTATE code and are never
// retried (connection-class codes 08 / 53 / 57P01 aside).
function isRetryableError(err: unknown): boolean {
	if (!err || typeof err !== 'object') return false;
	if (err instanceof Error && err.message.includes('Cannot perform I/O on behalf of a different request')) {
		return true;
	}
	const code = (err as { code?: unknown }).code;
	if (typeof code === 'string') {
		if (/^[0-9A-Za-z]{5}$/.test(code) && !/^(08|57P01|53[23]00)/.test(code)) return false;
		return true;
	}
	return true;
}

// Runs a query via `run`, retrying exactly once on transient (connection-class) failures.
// Preserves the `.values()` helper postgres.js attaches to results, which drizzle uses for
// field-mapped queries (e.g. Better Auth's `findOne`).
function retryable(run: () => UnsafeResult): UnsafeResult {
	let result: UnsafeResult;
	try {
		result = run();
	} catch (err) {
		if (isRetryableError(err)) return run();
		throw err;
	}

	const wrapped = result.then(
		(value) => value,
		(err: unknown) => {
			if (isRetryableError(err)) return run();
			throw err;
		}
	) as UnsafeResult;

	const rawValues = result.values;
	if (typeof rawValues === 'function') {
		const boundValues = rawValues.bind(result);
		wrapped.values = (...args: unknown[]) => {
			try {
				return boundValues(...args).catch((err: unknown) => {
					if (isRetryableError(err)) return run().values(...args);
					throw err;
				});
			} catch (err) {
				if (isRetryableError(err)) return run().values(...args);
				throw err;
			}
		};
	}

	return wrapped;
}

let dbInstance: PostgresJsDatabase<typeof schema> | null = null;

function getDb(): PostgresJsDatabase<typeof schema> {
	if (!dbInstance) {
		// Lazy: postgres.js only connects on the first query. `prepare: false` avoids named
		// prepared statements, `max: 1` keeps a single connection per Worker isolate and
		// `fetch_types: false` skips an extra pg_catalog round-trip on the edge.
		const client = postgres(resolveDbUrl(), { max: 1, prepare: false, fetch_types: false });
		const boundUnsafe = client.unsafe.bind(client) as (q: string, p?: unknown[], o?: unknown) => UnsafeResult;
		(client as unknown as { unsafe: typeof boundUnsafe }).unsafe = (query, params, options) =>
			retryable(() => boundUnsafe(query, params, options));
		dbInstance = drizzle(client, { schema });
		if (!dev) {
			console.log(`[db] connected host=${resolveDbUrl().replace(/:\/\/[^@]+@/, '://***@')}`);
		}
	}
	return dbInstance;
}

// Proxied until the first query so the connection string can be resolved lazily.
export const db: PostgresJsDatabase<typeof schema> = new Proxy(
	{} as PostgresJsDatabase<typeof schema>,
	{
		get(_, property, receiver) {
			const value = Reflect.get(getDb(), property, receiver);
			return typeof value === 'function' ? value.bind(getDb()) : value;
		}
	}
);