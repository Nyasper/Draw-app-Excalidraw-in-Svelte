import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateDrawing, deleteDrawing } from '$lib/server/db/queries';

export const PUT: RequestHandler = async (event) => {
	const user = event.locals.user;
	if (!user) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	const id = Number(event.params.id);
	if (isNaN(id)) return json({ error: 'Invalid ID' }, { status: 400 });

	const body = await event.request.json();
	const { title, elements, appState, files } = body;

	const updated = await updateDrawing(id, { title, elements, appState, files });

	return json(updated);
};

export const DELETE: RequestHandler = async (event) => {
	const user = event.locals.user;
	if (!user) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	const id = Number(event.params.id);
	if (isNaN(id)) return json({ error: 'Invalid ID' }, { status: 400 });

	await deleteDrawing(id);
	return json({ ok: true });
};
