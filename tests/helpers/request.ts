import type { RequestEvent } from '@sveltejs/kit';

export interface FakeUser {
	id: string;
}

export function createEvent<Event extends RequestEvent = RequestEvent<Record<string, string>>>(
	options: {
		user?: FakeUser;
		params?: Record<string, string>;
		request?: Request;
		routeId?: string | null;
	} = {}
): Event {
	return {
		locals: { user: options.user },
		params: options.params ?? {},
		request: options.request ?? new Request('http://localhost'),
		route: { id: options.routeId ?? null }
	} as unknown as Event;
}

export function jsonRequest(body: unknown): Request {
	return new Request('http://localhost', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: typeof body === 'string' ? body : JSON.stringify(body)
	});
}
