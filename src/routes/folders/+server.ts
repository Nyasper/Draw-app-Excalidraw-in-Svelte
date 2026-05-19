import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createFolder, getUserFolders } from '$lib/server/db/queries';

export const GET: RequestHandler = async (event) => {
	const user = event.locals.user;
	if (!user) return json({ error: 'Not authenticated' }, { status: 401 });

	const folders = await getUserFolders(user.id);
	return json(folders);
};

export const POST: RequestHandler = async (event) => {
	const user = event.locals.user;
	if (!user) return json({ error: 'Not authenticated' }, { status: 401 });

	const body = await event.request.json();
	const name = body.name?.toString()?.trim();
	if (!name) return json({ error: 'Name is required' }, { status: 400 });

	const folder = await createFolder(user.id, name);
	return json(folder, { status: 201 });
};
