import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';

// Connection string for Cloudflare production. On Workers the Hyperdrive binding is only
// available at request time (event.platform.env), so hooks.server.ts calls this before any query.
let cloudflareConnectionString = '';

export function setDbConnectionString(url: string) {
	cloudflareConnectionString = url;
}

function resolveDbUrl(): string {
	// Local dev (vite) keeps using Docker Postgres via DATABASE_URL.
	// Cloudflare runs a production build and prefers the Hyperdrive binding when present.
	const url = dev ? env.DATABASE_URL : cloudflareConnectionString || env.DATABASE_URL;
	if (!url) throw new Error('DATABASE_URL is not set');
	return url;
}

function sanitizeUrl(url: string): string {
	try {
		const u = new URL(url);
		return `${u.protocol}//${u.host}${u.pathname}`;
	} catch {
		return '<invalid>';
	}
}

let dbInstance: PostgresJsDatabase<typeof schema> | null = null;

function getDb(): PostgresJsDatabase<typeof schema> {
	if (!dbInstance) {
		// Lazy: postgres.js only connects on the first query. `prepare: false` avoids named
		// prepared statements (safer with Hyperdrive connection pooling), `fetch_types: false`
		// skips an extra pg_catalog round-trip on the edge.
		const client = postgres(resolveDbUrl(), { max: 5, prepare: false, fetch_types: false });
		dbInstance = drizzle(client, { schema });
		if (!dev) {
			// One-time diagnostic per isolate: which host we connected to and whether the
			// relational query API used by the Better Auth drizzle adapter is available
			// (a missing `db.query` silently makes session lookups return null).
			const relational = ((dbInstance.query as { session?: unknown } | undefined) ?? undefined)
				?.session
				? 'yes'
				: 'no';
			console.log(
				`[db] connected host=${sanitizeUrl(resolveDbUrl())} relationalSession=${relational}`
			);
		}
	}
	return dbInstance;
}

// Proxied until the first query so the connection string can be resolved from
// event.platform.env (Hyperdrive) without touching any of the existing consumers.
export const db: PostgresJsDatabase<typeof schema> = new Proxy(
	{} as PostgresJsDatabase<typeof schema>,
	{
		get(_, property, receiver) {
			const value = Reflect.get(getDb(), property, receiver);
			return typeof value === 'function' ? value.bind(getDb()) : value;
		}
	}
);
