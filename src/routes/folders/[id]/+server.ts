import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { renameFolder, deleteFolder } from '$lib/server/db/queries';

export const PUT: RequestHandler = async (event) => {
	const user = event.locals.user;
	if (!user) return json({ error: 'Not authenticated' }, { status: 401 });

	const id = Number(event.params.id);
	if (isNaN(id)) return json({ error: 'Invalid ID' }, { status: 400 });

	const body = await event.request.json();
	const name = body.name?.toString()?.trim();
	if (!name) return json({ error: 'Name is required' }, { status: 400 });

	const updated = await renameFolder(id, user.id, name);
	if (!updated) return json({ error: 'Not found' }, { status: 404 });

	return json(updated);
};

export const DELETE: RequestHandler = async (event) => {
	const user = event.locals.user;
	if (!user) return json({ error: 'Not authenticated' }, { status: 401 });

	const id = Number(event.params.id);
	if (isNaN(id)) return json({ error: 'Invalid ID' }, { status: 400 });

	const deleted = await deleteFolder(id, user.id);
	if (!deleted) return json({ error: 'Not found' }, { status: 404 });

	return json({ ok: true });
};
