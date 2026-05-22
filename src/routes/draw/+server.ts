import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createDrawing, updateDrawing } from '$lib/server/db/queries';

export const POST: RequestHandler = async (event) => {
	const user = event.locals.user;
	if (!user) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	try {
		const body = await event.request.json();
		const title = body.title?.toString() ?? 'Untitled';
		const folderId = body.folderId != null ? Number(body.folderId) : undefined;
		const { elements, appState, files } = body;

		const drawing = await createDrawing(user.id, title, folderId);
		if (elements || appState || files) {
			await updateDrawing(drawing.id, user.id, { elements, appState, files });
		}

		return json({ id: drawing.id }, { status: 201 });
	} catch (err) {
		console.error('POST /draw failed:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
