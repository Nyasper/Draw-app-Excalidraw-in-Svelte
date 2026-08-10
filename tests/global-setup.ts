import { execSync } from 'node:child_process';
import postgres from 'postgres';
import { ADMIN_DATABASE_URL, TEST_DATABASE_NAME, TEST_DATABASE_URL } from './test-db';

type PostgresClient = ReturnType<typeof postgres>;

/**
 * Ready the shared integration-test database before any test file runs:
 * 1. Drop + recreate `svelte_excalidraw_test` so every run starts from a clean slate.
 * 2. Push the drizzle schema into it with `drizzle-kit push --force`.
 *
 * Requires a running Postgres (the same one used for local dev via `bun run db:start`).
 * If the database is unreachable the setup logs an error and continues; unit tests still
 * pass and the DB tests fail with a clear connection error instead of a cryptic one.
 */
export default async function setup(): Promise<void> {
	let admin: PostgresClient | null = null;
	try {
		admin = postgres(ADMIN_DATABASE_URL, { max: 1, connect_timeout: 3 });
		await admin.unsafe(`DROP DATABASE IF EXISTS ${TEST_DATABASE_NAME}`);
		await admin.unsafe(`CREATE DATABASE ${TEST_DATABASE_NAME}`);
	} catch (err) {
		console.error('[test-setup] could not (re)create the test database:', err);
		console.error('[test-setup] DB integration tests will fail unless Postgres is running.');
		return;
	} finally {
		await admin?.end({ timeout: 1 });
	}

	execSync('drizzle-kit push --force', {
		cwd: process.cwd(),
		env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
		stdio: 'inherit'
	});
}
