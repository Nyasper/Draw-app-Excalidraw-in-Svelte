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
// so the FIRST statement of every subsequent request can be rejected with "Cannot perform
// I/O on behalf of a different request". postgres.js reconnects automatically and a fresh
// socket is created in the current request's context, so retrying once makes the query
// succeed. Statements after the first one reuse the socket within the same request.
//
// Retrying a WRITE is never safe: postgres.js buffers the query, the flush can reach the
// server and commit, and only afterwards does the cross-request I/O error surface (the
// "Cannot perform I/O on behalf of a different request" message is NOT guaranteed to fire
// before bytes are sent). Re-running the same statement would then duplicate the write or
// violate its primary/unique key (Better Auth's OAuth state INSERT hit `verification_pkey`
// 23505 this way). Reads are idempotent, so they may always be retried.
//
// To keep writes on a socket owned by the current request, every request is expected to run
// a read first (session lookup in hooks, or `primeDbConnection()` for guests) so the socket
// is (re)created in the current request's context before any write runs.
const WRITE_QUERY_RE = /^\s*(insert|update|delete|replace|merge|upsert|truncate|copy)\b/i;

function isWriteQuery(query: unknown): boolean {
	return WRITE_QUERY_RE.test(String(query ?? ''));
}

function isRetryableError(err: unknown, query: unknown): boolean {
	if (!err || typeof err !== 'object') return false;
	if (isWriteQuery(query)) return false;
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
// Writes are never retried on ambiguous errors (see `isRetryableError`). Preserves the
// `.values()` helper postgres.js attaches to results, which drizzle uses for field-mapped
// queries (e.g. Better Auth's `findOne`).
function retryable(run: () => UnsafeResult, query: unknown): UnsafeResult {
	let result: UnsafeResult;
	try {
		result = run();
	} catch (err) {
		if (isRetryableError(err, query)) return run();
		throw err;
	}

	const wrapped = result.then(
		(value) => value,
		(err: unknown) => {
			if (isRetryableError(err, query)) return run();
			throw err;
		}
	) as UnsafeResult;

	const rawValues = result.values;
	if (typeof rawValues === 'function') {
		const boundValues = rawValues.bind(result);
		wrapped.values = (...args: unknown[]) => {
			try {
				return boundValues(...args).catch((err: unknown) => {
					if (isRetryableError(err, query)) return run().values(...args);
					throw err;
				});
			} catch (err) {
				if (isRetryableError(err, query)) return run().values(...args);
				throw err;
			}
		};
	}

	return wrapped;
}

let dbInstance: PostgresJsDatabase<typeof schema> | null = null;
let dbClient: ReturnType<typeof postgres> | null = null;

function getDb(): PostgresJsDatabase<typeof schema> {
	if (!dbInstance) {
		// Lazy: postgres.js only connects on the first query. `prepare: false` avoids named
		// prepared statements, `max: 1` keeps a single connection per Worker isolate and
		// `fetch_types: false` skips an extra pg_catalog round-trip on the edge.
		const client = postgres(resolveDbUrl(), { max: 1, prepare: false, fetch_types: false });
		dbClient = client;
		const boundUnsafe = client.unsafe.bind(client) as (q: string, p?: unknown[], o?: unknown) => UnsafeResult;
		(client as unknown as { unsafe: typeof boundUnsafe }).unsafe = (query, params, options) =>
			retryable(() => boundUnsafe(query, params, options), query);
		dbInstance = drizzle(client, { schema });
		if (!dev) {
			console.log(`[db] connected host=${resolveDbUrl().replace(/:\/\/[^@]+@/, '://***@')}`);
		}
	}
	return dbInstance;
}

// Runs a trivial read so the postgres socket is (re)created inside the CURRENT request's
// context. Writes are never retried, so they must not be the first statement of a request —
// call this from hooks for requests that skipped the session lookup (guests) so a stale
// cross-request socket can't swallow a write with an ambiguous "Cannot perform I/O" error.
export async function primeDbConnection(): Promise<void> {
	getDb();
	if (dbClient) {
		await dbClient.unsafe('select 1');
	}
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