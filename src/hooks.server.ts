import type { Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { primeDbConnection } from '$lib/server/db';
import { svelteKitHandler } from 'better-auth/svelte-kit';

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	try {
		const session = await auth.api.getSession({ headers: event.request.headers });

		if (session) {
			event.locals.session = session.session;
			event.locals.user = session.user;
		} else {
			// Guests skip the session lookup, so no DB read happens before any route handler
			// runs. Warm up the postgres socket in THIS request's context — writes are never
			// retried, so they must not be the first statement of a request.
			try {
				await primeDbConnection();
			} catch (err) {
				console.error('DB warm-up failed', {
					path: event.url.pathname,
					message: err instanceof Error ? err.message : String(err)
				});
			}
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
		console.error('Session lookup failed', {
			path: event.url.pathname,
			message: err instanceof Error ? err.message : String(err),
			cause: causeMsg,
			stack:
				err instanceof Error ? (err.stack || '').split('\n').slice(0, 5).join(' | ') : undefined
		});
	}

	const response = await svelteKitHandler({ event, resolve, auth, building });

	// Better Auth responses have no Cache-Control, and Cloudflare edge-caches dynamic
	// GET responses like /api/auth/get-session. Never cache auth traffic.
	if (event.url.pathname.startsWith('/api/auth/')) {
		response.headers.set('Cache-Control', 'no-store');
	}

	return response;
};

export const handle: Handle = handleBetterAuth;
