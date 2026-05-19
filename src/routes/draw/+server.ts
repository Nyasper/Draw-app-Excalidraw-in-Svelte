import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createDrawing, updateDrawing } from '$lib/server/db/queries';

export const POST: RequestHandler = async (event) => {
	const user = event.locals.user;
	if (!user) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	const body = await event.request.json();
	const title = body.title?.toString() ?? 'Untitled';
	const { elements, appState, files } = body;

	const drawing = await createDrawing(user.id, title);
	await updateDrawing(drawing.id, { elements, appState, files });

	return json({ id: drawing.id }, { status: 201 });
};
