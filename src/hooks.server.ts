import type { Handle } from '@sveltejs/kit';
import { building, dev } from '$app/environment';
import { auth } from '$lib/server/auth';
import { db, setDbConnectionString } from '$lib/server/db';
import { svelteKitHandler } from 'better-auth/svelte-kit';

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	// In production on Cloudflare Workers, the Postgres connection goes through the
	// Hyperdrive binding, which is only available here via event.platform. The db module
	// lazily connects on the first query, so this must run before anything touches the DB.
	if (!dev && !building) {
		setDbConnectionString(event.platform?.env.HYPERDRIVE?.connectionString ?? '');
	}

	try {
		const session = await auth.api.getSession({ headers: event.request.headers });

		if (session) {
			event.locals.session = session.session;
			event.locals.user = session.user;
		}
	} catch (err) {
		const cause = (err as { cause?: unknown })?.cause;
		const causeMsg =
			cause instanceof Error
				? (cause.message || '').slice(0, 500)
				: typeof cause === 'string'
					? cause.slice(0, 500)
					: cause && typeof cause === 'object'
						? JSON.stringify(cause).slice(0, 500)
						: String(cause ?? '');
		let relationalSession: string;
		try {
			relationalSession = (db.query as { session?: unknown } | undefined)?.session ? 'yes' : 'no';
		} catch {
			relationalSession = 'error';
		}
		console.error('Session lookup failed', {
			path: event.url.pathname,
			message: err instanceof Error ? err.message : String(err),
			cause: causeMsg,
			hyperdrive: !!event.platform?.env?.HYPERDRIVE,
			relationalSession,
			stack:
				err instanceof Error ? (err.stack || '').split('\n').slice(0, 5).join(' | ') : undefined
		});
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

export const handle: Handle = handleBetterAuth;
