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

	try {
		const body = await event.request.json();
		const { title, elements, appState, files, folderId } = body;

		const updated = await updateDrawing(id, user.id, {
			title,
			elements,
			appState,
			files,
			folderId
		});
		if (!updated) return json({ error: 'Not found' }, { status: 404 });

		return json(updated);
	} catch (err) {
		console.error(`PUT /draw/${id} failed:`, err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async (event) => {
	const user = event.locals.user;
	if (!user) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	const id = Number(event.params.id);
	if (isNaN(id)) return json({ error: 'Invalid ID' }, { status: 400 });

	try {
		const deleted = await deleteDrawing(id, user.id);
		if (!deleted) return json({ error: 'Not found' }, { status: 404 });

		return json({ ok: true });
	} catch (err) {
		console.error(`DELETE /draw/${id} failed:`, err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
