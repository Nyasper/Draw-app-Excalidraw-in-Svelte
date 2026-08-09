import type { Handle } from '@sveltejs/kit';
import { building, dev } from '$app/environment';
import { auth } from '$lib/server/auth';
import { setDbConnectionString } from '$lib/server/db';
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
		console.error('Session lookup failed:', err);
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

export const handle: Handle = handleBetterAuth;
